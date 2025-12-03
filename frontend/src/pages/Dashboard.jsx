import { useState } from 'react'
import GraphTile from '../components/GraphTile.jsx'
import { generateVisualization } from '../services/nl4dv.js'
import '../styles/dashboard.css'

function Dashboard() {
  const [tiles, setTiles] = useState([
    { id: 1, type: 'graph' },
    { id: 2, type: 'graph' }
  ])
  const [graphData, setGraphData] = useState({}) // Object to store graph data for each tile
  const [loading, setLoading] = useState({}) // Track loading state per tile
  const [errors, setErrors] = useState({}) // Track errors per tile
  const [nextId, setNextId] = useState(3) // Track next tile ID

  const handleGraphRequest = async (tileNumber, prompt, dataset = 'movies-w-year.csv') => {
    if (!prompt.trim()) {
      setErrors(prev => ({
        ...prev,
        [tileNumber]: 'Please enter a query'
      }))
      return
    }

    // Clear previous error
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[tileNumber]
      return newErrors
    })

    // Set loading state
    setLoading(prev => ({
      ...prev,
      [tileNumber]: true
    }))

    try {
      const response = await generateVisualization(prompt, dataset)

      // Log response analysis
      console.log(`🔍 [Tile ${tileNumber}] Analyzing response:`, {
        status: response.status,
        hasVisList: !!response.visList,
        visListLength: response.visList?.length || 0,
        query: prompt,
        dataset: dataset
      })

      // Backend only returns status: "FAILURE" on errors, not status: "SUCCESS" on success
      // So we just check if visList exists and has items
      if (response.visList && response.visList.length > 0) {
        // Get the best visualization (first one, sorted by score)
        const bestVis = response.visList[0]

        // Log what we're about to store
        console.log(`💾 [Tile ${tileNumber}] Setting graph data:`, {
          hasVlSpec: !!bestVis.vlSpec,
          vlSpecKeys: bestVis.vlSpec ? Object.keys(bestVis.vlSpec) : [],
          dataUrl: bestVis.vlSpec?.data?.url,
          hasInlineData: !!bestVis.vlSpec?.data?.values,
          mark: bestVis.vlSpec?.mark,
          encoding: bestVis.vlSpec?.encoding ? Object.keys(bestVis.vlSpec.encoding) : [],
          score: bestVis.score,
          visType: bestVis.visType
        })

        setGraphData(prev => ({
          ...prev,
          [tileNumber]: {
            vlSpec: bestVis.vlSpec,
            prompt: prompt,
            dataset: dataset,
            score: bestVis.score,
            visType: bestVis.visType
          }
        }))
      } else {
        console.warn(`⚠️ [Tile ${tileNumber}] No valid visualizations in response`)
        setErrors(prev => ({
          ...prev,
          [tileNumber]: 'No visualizations found for this query. Try rephrasing your question.'
        }))
      }
    } catch (error) {
      console.error('Visualization generation failed:', error)
      setErrors(prev => ({
        ...prev,
        [tileNumber]: `Error: ${error.message || 'Failed to generate visualization'}`
      }))
    } finally {
      setLoading(prev => ({
        ...prev,
        [tileNumber]: false
      }))
    }
  }

  const addGraphTile = () => {
    if (tiles.length < 4) {
      setTiles(prev => [...prev, { id: nextId, type: 'graph' }])
      setNextId(prev => prev + 1)
    }
  }

  const removeTile = () => {
    if (tiles.length > 2) {
      const removedTile = tiles[tiles.length - 1]
      setTiles(prev => prev.slice(0, -1))

      // Clean up data for removed tile
      setGraphData(prev => {
        const newData = { ...prev }
        delete newData[removedTile.id]
        return newData
      })
      setLoading(prev => {
        const newLoading = { ...prev }
        delete newLoading[removedTile.id]
        return newLoading
      })
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[removedTile.id]
        return newErrors
      })
    }
  }

  const clearGraphData = (tileId) => {
    setGraphData(prev => {
      const newData = { ...prev }
      delete newData[tileId]
      return newData
    })
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[tileId]
      return newErrors
    })
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-controls">
        <button
          className="tile-control-button tile-control-button--add"
          onClick={addGraphTile}
          disabled={tiles.length >= 4}
          title="Add a graph tile (max 4)"
        >
          + Add Graph Tile
        </button>
        {tiles.length > 2 && (
          <button
            className="tile-control-button tile-control-button--remove"
            onClick={removeTile}
            title="Remove a tile (min 2)"
          >
            - Remove Tile
          </button>
        )}
      </div>
      <div className={`tiles-container tiles-container--${tiles.length}`}>
        {tiles.map(tile => (
          <GraphTile
            key={tile.id}
            tileId={tile.id}
            graphData={graphData[tile.id]}
            loading={loading[tile.id]}
            error={errors[tile.id]}
            onGraphRequest={handleGraphRequest}
            onClearGraph={clearGraphData}
          />
        ))}
      </div>
    </div>
  )
}

export default Dashboard

