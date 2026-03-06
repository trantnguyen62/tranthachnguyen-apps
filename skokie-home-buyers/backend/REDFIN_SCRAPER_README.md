# Redfin Web Scraper Integration

The system now scrapes Redfin.com directly to get real property estimates - **no API keys needed**!

## How It Works

```
User enters address
       ↓
Search Redfin for property
       ↓
Scrape property page
       ↓
Extract Redfin Estimate ($439,522)
       ↓
Calculate cash offer (50-72%)
       ↓
Show both estimates to user
```

## Example Response

When a user enters `8234 Oakton St, Skokie, IL`:

```json
{
  "success": true,
  "address": "8234 Oakton St, Skokie, IL 60076",

  "marketEstimate": {
    "value": 439522,
    "provider": "Redfin",
    "url": "https://www.redfin.com/IL/Skokie/8234-Oakton-St-60076/home/12345678"
  },

  "cashOffer": 285696,
  "offerPercentage": 65,

  "propertyDetails": {
    "sqft": 1850,
    "bedrooms": 3,
    "bathrooms": 2,
    "yearBuilt": 1958,
    "condition": "good"
  },

  "message": "Based on Redfin estimate of $439,522, we can offer you $285,696 in cash!"
}
```

## Technical Details

### Scraping Strategy

The scraper uses two approaches:

1. **Redfin Initial Data API** (Primary method)
   - Uses Redfin's internal JSON API
   - More reliable and structured
   - Returns property data directly

2. **HTML Scraping** (Fallback)
   - Parses the property page HTML with Cheerio
   - Extracts estimate and property details
   - Used if API method fails

### Files

- [redfinScraper.js](redfinScraper.js) - Main scraping logic
- [propertyDataService.js](propertyDataService.js) - Service layer that calls scraper
- [server.js](server.js) - API endpoint that uses the service

## Setup

No configuration needed! Just:

```bash
npm install
node server.js
```

The system will automatically:
1. Try to scrape Redfin
2. Fall back to mock data if Redfin blocks/fails

## Testing

Test with curl:

```bash
curl -X POST http://localhost:5188/api/get-offer \
  -H "Content-Type: application/json" \
  -d '{"address": "8234 Oakton Street, Skokie, IL 60076"}'
```

Or test the scraper directly:

```javascript
import { getRedfinEstimateAPI } from './redfinScraper.js';

const result = await getRedfinEstimateAPI('8234 Oakton St, Skokie, IL');
console.log(result);
```

## Important Notes

### Web Scraping Considerations

1. **Rate Limiting**: Redfin may block excessive requests. Consider adding:
   - Request delays for high volume
   - Proxy rotation if needed
   - Caching results

2. **Changes to Redfin**: If Redfin updates their website structure:
   - Update CSS selectors in `redfinScraper.js`
   - The fallback to mock data will still work

3. **Terms of Service**: Be aware of Redfin's ToS regarding scraping
   - Consider using their official API if available
   - Implement respectful scraping practices

### Production Recommendations

For production use:

1. **Add caching**:
   ```javascript
   // Cache Redfin results for 24 hours to reduce requests
   const cache = new Map();
   ```

2. **Add rate limiting**:
   ```javascript
   // Limit to 1 request per second
   await new Promise(resolve => setTimeout(resolve, 1000));
   ```

3. **Monitor success rate**:
   ```javascript
   // Log scraping success/failure rates
   console.log('Scraper success rate: 95%');
   ```

4. **Have fallback ready**:
   - Mock data is already implemented
   - Consider paid APIs as backup

## Cash Offer Calculation

Once we have the Redfin estimate, we calculate a realistic cash offer:

**Base Rate**: 55% of market value

**Adjustments**:
- Excellent condition: +12% (67% total)
- Good condition: +6% (61% total)
- Fair condition: +0% (55% total)
- New home (< 10 years): +5%
- Mid-age (< 25 years): +3%
- Very old (> 60 years): -5%
- Has garage: +2%
- Has basement: +2%
- Family home (4+ bed, 2200+ sqft): +3%
- Starter home (2+ bed, < 1500 sqft): +3%

**Final Range**: 50-72% of Redfin estimate

### Example Calculation

Redfin Estimate: $439,522
- Property: 3 bed, 2 bath, 1850 sqft, built 1958
- Condition: Good (+6%)
- Age 68 years: -5%
- Garage: +2%
- Basement: +2%

Total: 55% + 6% + 2% + 2% = 65%

Cash Offer: $439,522 × 65% = **$285,696**

## Error Handling

The system gracefully handles:

- Property not found on Redfin → Returns error message
- Redfin blocking requests → Falls back to mock data
- Invalid address → Validation error
- Network errors → Fallback to mock data

## Display to User

Show both estimates clearly:

```
🏠 Property Value
━━━━━━━━━━━━━━━━━━━━━━
Redfin Estimate: $439,522
                 ↓
Our Cash Offer:  $285,696 (65%)

✓ No fees
✓ No repairs needed
✓ Close in 7 days
```

## Updating the Scraper

If Redfin changes their website:

1. Open [redfinScraper.js](redfinScraper.js)
2. Update CSS selectors in `scrapeRedfinProperty()`:
   ```javascript
   const estimateSelectors = [
     '.statsValue',  // Update these if Redfin changes
     '[data-rf-test-id="avmLdpPrice"]',
     // Add new selectors
   ];
   ```
3. Test with a real address
4. Deploy update

## Alternative: Mock Data Mode

If you want to use only mock data (no scraping):

Edit [propertyDataService.js](propertyDataService.js):

```javascript
export async function getMarketEstimate(address) {
  // Skip Redfin, use mock directly
  return getMockEstimate(address);
}
```

Mock data uses historical Skokie sales to generate realistic estimates.
