/**
 * Tile Registry
 * Maps tile types to their corresponding components
 */

import Tiles from './tiles.jsx'
import GraphTile from './GraphTile.jsx'

const TILE_REGISTRY = {
  regular: Tiles,
  graph: GraphTile
}

/**
 * Get component for a specific tile type
 * @param {string} type - Tile type ('regular' or 'graph')
 * @returns {Component} React component for the tile type
 */
export const getTileComponent = (type) => {
  return TILE_REGISTRY[type] || TILE_REGISTRY.regular
}

/**
 * Get all available tile types
 * @returns {Array<string>} Array of tile type keys
 */
export const getAvailableTileTypes = () => {
  return Object.keys(TILE_REGISTRY)
}

export default TILE_REGISTRY
