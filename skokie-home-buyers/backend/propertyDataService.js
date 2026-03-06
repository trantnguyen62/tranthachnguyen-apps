/**
 * Property Data Service
 * Uses Cook County Assessor public data for property estimates
 */

import { getCookCountyAssessment } from './cookCountyAssessor.js';
import { estimateProperty } from './estimationService.js';

/**
 * Main function to get property market estimate
 * Uses Cook County Assessor public records for Skokie valuations
 */
export async function getMarketEstimate(address) {
  try {
    // Validate address
    if (!address || typeof address !== 'string') {
      return {
        success: false,
        error: 'Valid address is required'
      };
    }

    // Try to fetch from Cook County Assessor
    console.log('Fetching estimate for:', address);

    try {
      const cookCountyData = await getCookCountyAssessment(address);

      if (cookCountyData.success && cookCountyData.estimate) {
        console.log('Successfully retrieved Cook County estimate:', cookCountyData.estimate);
        return cookCountyData;
      }

      // If Cook County fails, fall back to historical data
      console.warn('Cook County lookup failed, using historical data');
      return getMockEstimate(address);

    } catch (cookCountyError) {
      console.warn('Cook County error, falling back to historical data:', cookCountyError.message);
      return getMockEstimate(address);
    }

  } catch (error) {
    console.error('Error fetching market estimate:', error);
    return {
      success: false,
      error: 'Unable to retrieve property estimate. Please try again.'
    };
  }
}

/**
 * Mock fallback when Redfin is not available
 * Uses the historical sales data approach for demonstration
 */
function getMockEstimate(address) {
  const result = estimateProperty(address);

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    provider: 'Mock Data (Redfin not available)',
    estimate: result.estimate,
    details: result.propertyDetails,
    url: null,
    isMock: true
  };
}

/**
 * Generate property condition from available details
 */
export function determineCondition(yearBuilt, details = {}) {
  const age = 2026 - yearBuilt;

  // Simplified condition logic
  if (age < 15) return 'excellent';
  if (age < 35) return 'good';
  return 'fair';
}
