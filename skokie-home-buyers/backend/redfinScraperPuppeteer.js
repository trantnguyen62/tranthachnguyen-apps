/**
 * Redfin Scraper using Puppeteer (Browser Automation)
 * Bypasses anti-bot protection by using real Chrome browser
 */

import puppeteer from 'puppeteer';

/**
 * Search for property on Redfin and get the property URL
 */
async function searchRedfinProperty(address) {
  try {
    const searchUrl = `https://www.redfin.com/stingray/do/location-autocomplete?location=${encodeURIComponent(address)}&start=0&count=10&v=2`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Redfin search failed: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.payload && data.payload.exactMatch) {
      return { url: data.payload.exactMatch.url, id: data.payload.exactMatch.id };
    }

    if (data && data.payload && data.payload.sections) {
      for (const section of data.payload.sections) {
        if (section.rows && section.rows.length > 0) {
          return { url: section.rows[0].url, id: section.rows[0].id };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Redfin search error:', error);
    return null;
  }
}

/**
 * Get Redfin estimate using Puppeteer
 */
export async function getRedfinEstimateWithPuppeteer(address) {
  let browser = null;

  try {
    console.log('Launching browser for Redfin scraping...');

    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set realistic viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Navigate to Redfin homepage
    console.log('Navigating to Redfin...');
    await page.goto('https://www.redfin.com', {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Find and use search box
    console.log('Entering address in search box...');
    const searchInput = await page.$('input[name="searchInputBox"]');
    if (!searchInput) {
      throw new Error('Could not find search box');
    }

    await searchInput.type(address, { delay: 100 });
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Submit search
    console.log('Submitting search...');
    await Promise.all([
      page.keyboard.press('Enter'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {
        console.log('Navigation wait timed out, continuing anyway...');
      })
    ]);

    const propertyUrl = page.url();
    console.log('Loaded URL:', propertyUrl);

    // Wait for page content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Try to extract Redfin Estimate using multiple selectors
    const estimate = await page.evaluate(() => {
      // Try multiple selectors for Redfin Estimate
      const selectors = [
        '[data-rf-test-id="avmLdpPrice"]',
        '.statsValue',
        '.avm-price',
        'div[class*="estimate"]',
        'span[class*="estimate"]'
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent.trim();
          // Extract number from "$439,522" format
          const match = text.match(/\$?([\d,]+)/);
          if (match) {
            return parseInt(match[1].replace(/,/g, ''));
          }
        }
      }

      // Try to find any element with price-like text
      const allElements = document.querySelectorAll('*');
      for (const el of allElements) {
        const text = el.textContent;
        if (text && text.includes('Redfin Estimate') || text.includes('redfin estimate')) {
          const priceMatch = text.match(/\$?([\d,]{6,})/);
          if (priceMatch) {
            return parseInt(priceMatch[1].replace(/,/g, ''));
          }
        }
      }

      return null;
    });

    // Extract property details
    const details = await page.evaluate(() => {
      const data = {
        bedrooms: null,
        bathrooms: null,
        sqft: null,
        yearBuilt: null,
        propertyType: null
      };

      // Try to find beds/baths/sqft
      const statsElements = document.querySelectorAll('[data-rf-test-id*="bed"], [data-rf-test-id*="bath"], [data-rf-test-id*="sqft"], .stats-list .stat-value, .keyDetails');

      statsElements.forEach(el => {
        const text = el.textContent.trim();

        // Beds
        if (text.match(/\d+\s*bed/i)) {
          const match = text.match(/(\d+)\s*bed/i);
          if (match) data.bedrooms = parseInt(match[1]);
        }

        // Baths
        if (text.match(/\d+\.?\d*\s*bath/i)) {
          const match = text.match(/([\d.]+)\s*bath/i);
          if (match) data.bathrooms = parseFloat(match[1]);
        }

        // Sqft
        if (text.match(/[\d,]+\s*sq\.?\s*ft/i)) {
          const match = text.match(/([\d,]+)\s*sq\.?\s*ft/i);
          if (match) data.sqft = parseInt(match[1].replace(/,/g, ''));
        }

        // Year built
        if (text.match(/built\s*:?\s*\d{4}/i)) {
          const match = text.match(/built\s*:?\s*(\d{4})/i);
          if (match) data.yearBuilt = parseInt(match[1]);
        }
      });

      return data;
    });

    await browser.close();

    if (!estimate) {
      return {
        success: false,
        error: 'Could not find Redfin estimate on page'
      };
    }

    console.log('Successfully scraped Redfin estimate:', estimate);

    return {
      success: true,
      provider: 'Redfin (Puppeteer)',
      estimate,
      address,
      details: {
        bedrooms: details.bedrooms,
        bathrooms: details.bathrooms,
        sqft: details.sqft,
        yearBuilt: details.yearBuilt,
        propertyType: details.propertyType || 'Single Family'
      },
      url: propertyUrl
    };

  } catch (error) {
    console.error('Puppeteer scraping error:', error.message);
    console.error('Full error:', error);

    if (browser) {
      await browser.close();
    }

    return {
      success: false,
      error: `Puppeteer scraping failed: ${error.message}`
    };
  }
}
