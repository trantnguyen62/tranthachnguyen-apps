/**
 * Redfin Web Scraper
 * Extracts property estimates and details from Redfin.com
 */

import * as cheerio from 'cheerio';

/**
 * Get realistic browser headers to avoid bot detection
 */
function getBrowserHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.redfin.com/',
    'Origin': 'https://www.redfin.com',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"'
  };
}

/**
 * Search for property on Redfin and get the property URL
 */
async function searchRedfinProperty(address) {
  try {
    // Redfin search URL
    const searchUrl = `https://www.redfin.com/stingray/do/location-autocomplete?location=${encodeURIComponent(address)}&start=0&count=10&v=2`;

    const response = await fetch(searchUrl, {
      headers: getBrowserHeaders(),
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`Redfin search failed: ${response.status}`);
    }

    const data = await response.json();

    // Extract first matching property
    if (data && data.payload && data.payload.exactMatch) {
      const property = data.payload.exactMatch;
      return {
        url: property.url,
        id: property.id
      };
    }

    // Try sections if no exact match
    if (data && data.payload && data.payload.sections) {
      for (const section of data.payload.sections) {
        if (section.rows && section.rows.length > 0) {
          const property = section.rows[0];
          return {
            url: property.url,
            id: property.id
          };
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
 * Scrape property details from Redfin property page
 */
async function scrapeRedfinProperty(propertyUrl) {
  try {
    const fullUrl = `https://www.redfin.com${propertyUrl}`;

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = await fetch(fullUrl, {
      headers: {
        ...getBrowserHeaders(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch property page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract Redfin Estimate
    let estimate = null;

    // Try multiple selectors for Redfin Estimate
    const estimateSelectors = [
      '.statsValue',  // Common class for estimate
      '[data-rf-test-id="avmLdpPrice"]',
      '.avm-price',
      'div.estimate-value'
    ];

    for (const selector of estimateSelectors) {
      const estimateText = $(selector).first().text().trim();
      if (estimateText && estimateText.includes('$')) {
        // Parse dollar amount: "$439,522" -> 439522
        estimate = parseInt(estimateText.replace(/[$,]/g, ''));
        if (!isNaN(estimate)) break;
      }
    }

    // If still not found, look for script data
    if (!estimate) {
      const scripts = $('script[type="application/ld+json"]');
      scripts.each((i, script) => {
        try {
          const jsonData = JSON.parse($(script).html());
          if (jsonData.offers && jsonData.offers.price) {
            estimate = parseInt(jsonData.offers.price);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });
    }

    // Extract property details
    let beds = null, baths = null, sqft = null, yearBuilt = null;

    // Look for property stats
    $('.stats-list .stat-value, .keyDetails .content-and-anchor').each((i, elem) => {
      const text = $(elem).text().trim();

      if (text.includes('Bed')) {
        beds = parseInt(text);
      }
      if (text.includes('Bath')) {
        baths = parseFloat(text);
      }
      if (text.includes('Sq Ft') || text.includes('sqft')) {
        sqft = parseInt(text.replace(/[^0-9]/g, ''));
      }
      if (text.includes('Built')) {
        const match = text.match(/\d{4}/);
        if (match) yearBuilt = parseInt(match[0]);
      }
    });

    // Try alternate selectors
    if (!beds) {
      const bedsText = $('[data-rf-test-id="abp-beds"]').text();
      beds = parseInt(bedsText) || null;
    }
    if (!baths) {
      const bathsText = $('[data-rf-test-id="abp-baths"]').text();
      baths = parseFloat(bathsText) || null;
    }
    if (!sqft) {
      const sqftText = $('[data-rf-test-id="abp-sqFt"]').text();
      sqft = parseInt(sqftText.replace(/[^0-9]/g, '')) || null;
    }

    // Extract address
    const address = $('h1.full-address, .street-address').first().text().trim();

    return {
      success: true,
      estimate,
      address,
      details: {
        bedrooms: beds,
        bathrooms: baths,
        sqft,
        yearBuilt,
        propertyType: 'Single Family' // Default, can be improved
      },
      url: fullUrl
    };

  } catch (error) {
    console.error('Scraping error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main function to get Redfin estimate for an address
 */
export async function getRedfinEstimate(address) {
  try {
    console.log('Searching Redfin for:', address);

    // Step 1: Search for property
    const searchResult = await searchRedfinProperty(address);

    if (!searchResult || !searchResult.url) {
      return {
        success: false,
        error: 'Property not found on Redfin'
      };
    }

    console.log('Found property URL:', searchResult.url);

    // Step 2: Scrape property page
    const propertyData = await scrapeRedfinProperty(searchResult.url);

    if (!propertyData.success) {
      return propertyData;
    }

    if (!propertyData.estimate) {
      return {
        success: false,
        error: 'Could not extract Redfin estimate from property page'
      };
    }

    return {
      success: true,
      provider: 'Redfin',
      estimate: propertyData.estimate,
      address: propertyData.address || address,
      details: propertyData.details,
      url: propertyData.url
    };

  } catch (error) {
    console.error('getRedfinEstimate error:', error);
    return {
      success: false,
      error: 'Failed to fetch Redfin estimate: ' + error.message
    };
  }
}

/**
 * Alternative: Use Redfin's initial-data API
 * This is more reliable as it returns JSON
 */
export async function getRedfinEstimateAPI(address) {
  try {
    // Search for property first
    const searchResult = await searchRedfinProperty(address);

    if (!searchResult || !searchResult.url) {
      return {
        success: false,
        error: 'Property not found on Redfin'
      };
    }

    // Extract property ID from URL
    // URL format: /IL/Skokie/8234-Keeler-Ave-60076/home/12345678
    const urlMatch = searchResult.url.match(/\/home\/(\d+)/);
    if (!urlMatch) {
      // Fall back to scraping
      return await scrapeRedfinProperty(searchResult.url);
    }

    const propertyId = urlMatch[1];

    // Fetch property data from Redfin API
    const apiUrl = `https://www.redfin.com/stingray/api/home/details/belowTheFold?propertyId=${propertyId}&accessLevel=1`;

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      // Fall back to scraping
      return await scrapeRedfinProperty(searchResult.url);
    }

    const text = await response.text();
    // Remove JSONP wrapper if present
    const jsonText = text.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    const data = JSON.parse(jsonText);

    if (data && data.payload) {
      const payload = data.payload;

      return {
        success: true,
        provider: 'Redfin',
        estimate: payload.avmDetails?.amount || payload.listPrice,
        address: `${payload.streetAddress}, ${payload.city}, ${payload.state} ${payload.zip}`,
        details: {
          bedrooms: payload.beds,
          bathrooms: payload.baths,
          sqft: payload.sqFt?.value,
          yearBuilt: payload.yearBuilt,
          propertyType: payload.propertyType
        },
        url: `https://www.redfin.com${searchResult.url}`
      };
    }

    // Fall back to scraping if API doesn't work
    return await scrapeRedfinProperty(searchResult.url);

  } catch (error) {
    console.error('Redfin API error:', error);
    // Fall back to scraping
    return await getRedfinEstimate(address);
  }
}
