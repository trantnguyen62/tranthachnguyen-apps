# Property Valuation API Setup

The system now integrates with real estate APIs (Zillow, Redfin, etc.) to provide accurate market estimates before calculating cash offers.

## How It Works

1. **User enters address** → System validates it's in Skokie, IL
2. **Fetch market estimate** → Calls Zillow/Redfin API to get current market value
3. **Display market value** → Shows user the Zillow/Redfin estimate
4. **Calculate cash offer** → Offers 50-72% of market value based on property condition
5. **Show comparison** → User sees both market value and cash offer side-by-side

## API Provider Options

### Option 1: RapidAPI (Recommended for Testing)

**Zillow API** via RapidAPI
- Free tier available
- URL: https://rapidapi.com/apimaker/api/zillow-com1
- Provides: Zestimate, property details, bedrooms, bathrooms, sqft

**Redfin API** via RapidAPI
- Free tier available
- URL: https://rapidapi.com/s.mahmoud97/api/redfin-com-data
- Provides: List price, property details

**Setup:**
```bash
# Get API key from RapidAPI.com
# Add to .env file:
PROPERTY_API_PROVIDER=zillow
RAPID_API_KEY=your-key-here
```

### Option 2: Attom Data Solutions

Enterprise-grade property data
- URL: https://api.developer.attomdata.com/
- Provides: AVM (Automated Valuation Model), detailed property data
- Free trial available

**Setup:**
```bash
PROPERTY_API_PROVIDER=attom
ATTOM_API_KEY=your-key-here
```

### Option 3: Mock Data (Default)

If no API keys are configured, system uses mock data with historical Skokie sales for demonstration.

## Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API key:
```env
PROPERTY_API_PROVIDER=zillow
RAPID_API_KEY=abc123xyz456
```

3. Restart the server:
```bash
node server.js
```

## API Response Format

The system now returns both market estimate and cash offer:

```json
{
  "success": true,
  "address": "8234 Oakton Street, Skokie, IL 60076",

  "marketEstimate": {
    "value": 450000,
    "provider": "Zillow",
    "url": "https://www.zillow.com/...",
    "isMock": false
  },

  "cashOffer": 292500,
  "offerPercentage": 65,

  "propertyDetails": {
    "sqft": 1850,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 1958,
    "condition": "good",
    "garage": true,
    "basement": true
  },

  "message": "Based on Zillow estimate of $450,000, we can offer you $292,500 in cash!"
}
```

## Cash Offer Calculation

The cash offer is calculated as **50-72%** of the market estimate, based on:

- **Property Condition** (biggest factor):
  - Excellent: 67% base
  - Good: 61% base
  - Fair: 55% base

- **Property Age**:
  - < 10 years: +5%
  - < 25 years: +3%
  - > 60 years: -5%

- **Desirable Features**:
  - Garage: +2%
  - Basement: +2%

- **Market Demand**:
  - Family homes (4+ bed, 2200+ sqft): +3%
  - Starter homes (2+ bed, < 1500 sqft): +3%

This results in realistic cash offers that account for:
- Repair costs
- Holding costs
- Transaction fees
- Investor profit margin

## Testing

Test the endpoint with curl:

```bash
curl -X POST http://localhost:5188/api/get-offer \
  -H "Content-Type: application/json" \
  -d '{"address": "8234 Oakton Street, Skokie, IL 60076"}'
```

## Cost Comparison

| Provider | Free Tier | Paid Plans | Best For |
|----------|-----------|------------|----------|
| RapidAPI (Zillow) | 500 requests/month | From $10/month | Testing, small volume |
| RapidAPI (Redfin) | 100 requests/month | From $20/month | Testing |
| Attom Data | Trial available | Custom pricing | Production, high volume |
| Mock Data | Unlimited | Free | Development, demo |

## Notes

- Without API keys, system automatically falls back to mock data
- Mock data still provides realistic estimates based on Skokie market
- For production, recommend Attom Data for accuracy and reliability
- RapidAPI is great for prototyping and low-volume testing
