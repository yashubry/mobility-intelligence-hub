/**
 * NL4DV API Service
 * Handles communication with the NL4DV backend for natural language to visualization
 */

const NL4DV_BASE_URL = 'http://localhost:7001';

/**
 * Generate visualization from natural language query
 * @param {string} query - Natural language query (e.g., "Show revenue by month")
 * @param {string} dataset - Dataset filename (default: "movies-w-year.csv")
 * @returns {Promise<Object>} Response containing visualization specs
 */
export const generateVisualization = async (query, dataset = 'movies-w-year.csv') => {
  try {
    const response = await fetch(`${NL4DV_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        dataset,
        debug: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Log the complete raw response for debugging
    console.log('✅ NL4DV Raw Response:', JSON.stringify(data, null, 2));

    // Log visualization details if available
    if (data.visList && data.visList.length > 0) {
      console.log('📊 Visualizations Generated:', {
        count: data.visList.length,
        bestMatch: {
          score: data.visList[0].score,
          visType: data.visList[0].visType,
          attributes: data.visList[0].attributes,
          dataUrl: data.visList[0].vlSpec?.data?.url,
          hasInlineData: !!data.visList[0].vlSpec?.data?.values
        }
      });
    } else {
      console.warn('⚠️ No visualizations in response');
    }

    if (data.status === 'FAILURE') {
      console.error('❌ NL4DV returned FAILURE status:', data.message);
      throw new Error(data.message || 'Visualization generation failed');
    }

    return data;
  } catch (error) {
    console.error('NL4DV API Error:', error);
    throw error;
  }
};

/**
 * Check NL4DV backend health
 * @returns {Promise<Object>} Health status
 */
export const checkHealth = async () => {
  try {
    const response = await fetch(`${NL4DV_BASE_URL}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};
