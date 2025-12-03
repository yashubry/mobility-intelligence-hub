/**
 * Graph Storage Utility
 * Manages saving and retrieving Vega-Lite visualizations in localStorage
 */

const STORAGE_KEY = 'saved_graphs';

/**
 * Generate unique ID for a graph
 * @returns {string} Unique ID
 */
const generateId = () => {
  return `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get all saved graphs from localStorage
 * @returns {Array} Array of saved graph objects
 */
export const getSavedGraphs = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error retrieving saved graphs:', error);
    return [];
  }
};

/**
 * Save a new graph to localStorage
 * @param {Object} params - Graph parameters
 * @param {string} params.prompt - Natural language query used
 * @param {Object} params.vlSpec - Vega-Lite specification
 * @param {string} params.dataset - Dataset filename
 * @returns {Object} Saved graph object with ID
 */
export const saveGraph = ({ prompt, vlSpec, dataset }) => {
  try {
    const graphs = getSavedGraphs();

    const newGraph = {
      id: generateId(),
      prompt,
      vlSpec,
      dataset,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toLocaleString()
    };

    graphs.push(newGraph);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graphs));

    return newGraph;
  } catch (error) {
    console.error('Error saving graph:', error);
    throw error;
  }
};

/**
 * Delete a saved graph by ID
 * @param {string} id - Graph ID to delete
 * @returns {boolean} Success status
 */
export const deleteGraph = (id) => {
  try {
    const graphs = getSavedGraphs();
    const filtered = graphs.filter(graph => graph.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting graph:', error);
    return false;
  }
};

/**
 * Clear all saved graphs
 * @returns {boolean} Success status
 */
export const clearAllGraphs = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing graphs:', error);
    return false;
  }
};

/**
 * Get a single graph by ID
 * @param {string} id - Graph ID
 * @returns {Object|null} Graph object or null if not found
 */
export const getGraphById = (id) => {
  const graphs = getSavedGraphs();
  return graphs.find(graph => graph.id === id) || null;
};
