import { useState, useEffect, useRef } from 'react'
import vegaEmbed from 'vega-embed'
import { getSavedGraphs, deleteGraph, clearAllGraphs } from '../utils/graphStorage.js'
import GraphRenderer from '../components/GraphRenderer.jsx'
import '../styles/savedGraphs.css'

function SavedGraphs() {
  const [graphs, setGraphs] = useState([])
  const graphRefs = useRef({})

  useEffect(() => {
    loadGraphs()
  }, [])

  useEffect(() => {
    // Render all custom (non-preset) graphs when they load
    graphs.forEach(graph => {
      const ref = graphRefs.current[graph.id]
      // Only render custom graphs that have vlSpec (not preset graphs)
      if (ref && graph.vlSpec && !graph.isPreset) {
        renderGraph(ref, graph.vlSpec)
      }
    })
  }, [graphs])

  const loadGraphs = () => {
    const savedGraphs = getSavedGraphs()
    setGraphs(savedGraphs)
  }

  const renderGraph = async (container, vlSpec) => {
    if (!container) return

    container.innerHTML = ''

    try {
      await vegaEmbed(container, vlSpec, {
        actions: {
          export: true,
          source: false,
          compiled: false,
          editor: false
        },
        renderer: 'canvas'
      })
    } catch (error) {
      console.error('Vega rendering error:', error)
      container.innerHTML = '<div class="render-error">Failed to render visualization</div>'
    }
  }

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this graph?')) {
      deleteGraph(id)
      loadGraphs()
    }
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all saved graphs? This cannot be undone.')) {
      clearAllGraphs()
      loadGraphs()
    }
  }

  if (graphs.length === 0) {
    return (
      <section className="saved-graphs-page">
        <div className="saved-graphs-header">
          <h1>Saved Graphs</h1>
        </div>
        <div className="empty-state">
          <svg className="empty-state-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          <h2>No Saved Graphs</h2>
          <p>Generate and save visualizations from the Dashboard to see them here.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="saved-graphs-page">
      <div className="saved-graphs-header">
        <div>
          <h1>Saved Graphs</h1>
          <p className="subtitle">{graphs.length} saved visualization{graphs.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="clear-all-button" onClick={handleClearAll}>
          Clear All
        </button>
      </div>

      <div className="saved-graphs-grid">
        {graphs.map(graph => (
          <div key={graph.id} className="saved-graph-card">
            <div className="graph-card-header">
              <div className="graph-metadata">
                <h3 className="graph-prompt">{graph.prompt}</h3>
                <div className="graph-details">
                  <span className="graph-dataset">
                    {graph.isPreset ? '📈 Preset Graph' : `📊 ${graph.dataset}`}
                  </span>
                  <span className="graph-date">🕐 {graph.createdAt}</span>
                </div>
              </div>
              <button
                className="delete-button"
                onClick={() => handleDelete(graph.id)}
                title="Delete this graph"
              >
                🗑️
              </button>
            </div>

            <div className="saved-graph-container">
              {graph.isPreset && graph.preset ? (
                <GraphRenderer graphConfig={graph.preset} />
              ) : (
                <div
                  ref={(el) => {
                    if (el) graphRefs.current[graph.id] = el
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default SavedGraphs
 