import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getMarketEstimate, determineCondition } from './propertyDataService.js';
import { calculateCashOffer } from './estimationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5188;

app.use(cors());
app.use(express.json());

// Serve static frontend files
const frontendPath = join(__dirname, '..');
app.use(express.static(frontendPath));

// In-memory storage for leads (in production, use a database)
let leads = [];
let leadIdCounter = 1;

// Email configuration (optional - set via environment variables)
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  user: process.env.EMAIL_USER,
  pass: process.env.EMAIL_PASS,
  notifyEmail: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER
};

// Create email transporter if credentials are provided
let emailTransporter = null;
if (emailConfig.user && emailConfig.pass) {
  emailTransporter = nodemailer.createTransport({
    service: emailConfig.service,
    auth: {
      user: emailConfig.user,
      pass: emailConfig.pass
    }
  });
}

// Get instant cash offer for a property
app.post('/api/get-offer', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }

    // Validate Skokie address
    const addressLower = address.toLowerCase();
    const isSkokie = addressLower.includes('60076') ||
                     addressLower.includes('skokie');

    if (!isSkokie) {
      return res.status(400).json({
        success: false,
        error: 'We currently only buy properties in Skokie, IL (60076). Please enter a valid Skokie address.'
      });
    }

    // Get market estimate from Zillow/Redfin/etc
    const marketData = await getMarketEstimate(address);

    if (!marketData.success) {
      return res.status(400).json(marketData);
    }

    // Prepare property details for cash offer calculation
    const propertyDetails = {
      sqft: marketData.details.sqft || 1800,
      bedrooms: marketData.details.bedrooms || 3,
      bathrooms: marketData.details.bathrooms || 2,
      yearBuilt: marketData.details.yearBuilt || 1970,
      propertyType: marketData.details.propertyType || 'Single Family',
      condition: determineCondition(marketData.details.yearBuilt || 1970, marketData.details),
      garage: true, // Default assumption
      basement: true // Common in Skokie
    };

    // Calculate cash offer based on market estimate
    const offerResult = calculateCashOffer(
      marketData.estimate,
      address,
      propertyDetails
    );

    const response = {
      success: true,
      address: address,

      // Market estimate from Zillow/Redfin
      marketEstimate: {
        value: marketData.estimate,
        provider: marketData.provider,
        url: marketData.url,
        isMock: marketData.isMock || false
      },

      // Our cash offer
      cashOffer: offerResult.cashOffer,
      offerPercentage: offerResult.offerPercentage,

      // Property details
      propertyDetails: propertyDetails,

      // Factors affecting the offer
      offerFactors: offerResult.factors,

      message: `Based on ${marketData.provider} estimate of $${marketData.estimate.toLocaleString()}, we can offer you $${offerResult.cashOffer.toLocaleString()} in cash!`
    };

    console.log('Cash offer generated:', response);

    res.json(response);

  } catch (error) {
    console.error('Error generating offer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate offer'
    });
  }
});

// Submit a new lead
app.post('/api/leads', async (req, res) => {
  try {
    const { address, email, phone, estimate, cashOffer, offerPercentage } = req.body;

    // Validate required fields
    if (!address || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Create new lead
    const newLead = {
      id: leadIdCounter++,
      address,
      email,
      phone,
      estimate: estimate || null,
      cashOffer: cashOffer || null,
      offerPercentage: offerPercentage || null,
      submittedAt: new Date().toISOString(),
      status: 'new'
    };

    leads.push(newLead);

    // Send email notification if configured
    if (emailTransporter && emailConfig.notifyEmail) {
      try {
        await emailTransporter.sendMail({
          from: emailConfig.user,
          to: emailConfig.notifyEmail,
          subject: `New Lead: ${address}${cashOffer ? ' - $' + cashOffer.toLocaleString() : ''}`,
          html: `
            <h2>New Lead Submission</h2>
            <p><strong>Property Address:</strong> ${address}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            ${estimate ? `<p><strong>Property Estimate:</strong> $${estimate.toLocaleString()}</p>` : ''}
            ${cashOffer ? `<p><strong>Cash Offer Shown:</strong> $${cashOffer.toLocaleString()}</p>` : ''}
            ${offerPercentage ? `<p><strong>Offer Percentage:</strong> ${offerPercentage}%</p>` : ''}
            <p><strong>Submitted:</strong> ${new Date(newLead.submittedAt).toLocaleString()}</p>
          `
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError.message);
        // Don't fail the request if email fails
      }
    }

    console.log('New lead submitted:', newLead);

    res.json({
      success: true,
      message: 'Lead submitted successfully',
      leadId: newLead.id
    });

  } catch (error) {
    console.error('Error submitting lead:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit lead'
    });
  }
});

// Get all leads (admin endpoint)
app.get('/api/leads', (req, res) => {
  // In production, add authentication here
  const sortedLeads = [...leads].sort((a, b) =>
    new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  res.json({
    success: true,
    count: leads.length,
    leads: sortedLeads
  });
});

// Get lead by ID
app.get('/api/leads/:id', (req, res) => {
  const lead = leads.find(l => l.id === parseInt(req.params.id));

  if (!lead) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  res.json({
    success: true,
    lead
  });
});

// Update lead status
app.patch('/api/leads/:id', (req, res) => {
  const { status } = req.body;
  const lead = leads.find(l => l.id === parseInt(req.params.id));

  if (!lead) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  if (status) {
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    lead
  });
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
  const index = leads.findIndex(l => l.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Lead not found'
    });
  }

  const deletedLead = leads.splice(index, 1)[0];

  res.json({
    success: true,
    message: 'Lead deleted successfully',
    lead: deletedLead
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    leadsCount: leads.length,
    emailConfigured: !!emailTransporter
  });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Skokie Home Buyers backend running on http://localhost:${PORT}`);
  console.log(`Email notifications: ${emailTransporter ? 'ENABLED' : 'DISABLED'}`);
  if (!emailTransporter) {
    console.log('To enable email notifications, set EMAIL_USER and EMAIL_PASS environment variables');
  }
});
