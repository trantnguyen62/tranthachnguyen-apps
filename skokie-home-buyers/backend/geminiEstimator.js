/**
 * Gemini AI Property Estimator
 * Uses Google's Gemini AI to estimate property values
 */

const GEMINI_API_KEY = 'AIzaSyBtMygy_7y-9LcuVQLpf-VZWDq8oN4IaUQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Get property estimate using Gemini AI
 */
export async function getGeminiEstimate(address) {
  try {
    console.log('Getting Gemini AI estimate for:', address);

    const prompt = `You are a real estate valuation expert. Analyze this property address and provide an estimated market value.

Address: ${address}

Based on your knowledge of the Skokie, IL 60076 real estate market, provide:
1. Estimated market value (in USD)
2. Estimated square footage
3. Estimated bedrooms
4. Estimated bathrooms
5. Estimated year built
6. Brief reasoning

IMPORTANT: Respond ONLY with valid JSON in this exact format, no other text:
{
  "estimate": 350000,
  "sqft": 1500,
  "bedrooms": 3,
  "bathrooms": 2,
  "yearBuilt": 1960,
  "reasoning": "Based on Skokie market data..."
}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the text response
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error('No response from Gemini');
    }

    console.log('Gemini raw response:', textResponse);

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = textResponse;
    if (textResponse.includes('```')) {
      jsonStr = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    const parsed = JSON.parse(jsonStr);

    return {
      success: true,
      provider: 'Gemini AI',
      estimate: parsed.estimate,
      address,
      details: {
        sqft: parsed.sqft,
        bedrooms: parsed.bedrooms,
        bathrooms: parsed.bathrooms,
        yearBuilt: parsed.yearBuilt,
        propertyType: 'Single Family',
        reasoning: parsed.reasoning
      },
      url: null
    };

  } catch (error) {
    console.error('Gemini estimation error:', error.message);
    return {
      success: false,
      error: `Gemini estimation failed: ${error.message}`
    };
  }
}
