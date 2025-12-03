import { useState, useEffect, useRef } from 'react'
import GraphRenderer from './GraphRenderer.jsx'
import { PRESET_GRAPHS } from '../services/csvDataService'
import '../styles/tiles.css'

function Tiles({ tileCount = 2, graphData = {}, onGraphRequest }) {
  const [prompts, setPrompts] = useState({})
  const [selectedPresets, setSelectedPresets] = useState({}) // Track preset selection per tile
  const graphContainerRefs = useRef({})

  // Initialize refs for all tiles
  useEffect(() => {
    for (let i = 1; i <= tileCount; i++) {
      if (!graphContainerRefs.current[i]) {
        graphContainerRefs.current[i] = { current: null }
      }
    }
  }, [tileCount])

  // Render graph when graphData changes for any tile (custom mode)
  useEffect(() => {
    Object.keys(graphData).forEach(tileNumber => {
      // Only render if no preset is selected (custom mode)
      if (!selectedPresets[tileNumber]) {
        const ref = graphContainerRefs.current[tileNumber]
        if (graphData[tileNumber] && ref?.current) {
          renderGraph(ref.current, graphData[tileNumber])
        }
      }
    })
  }, [graphData, selectedPresets])

  const renderGraph = (container, graphData) => {
    // Clear previous content
    container.innerHTML = ''
    
    // If graphData is a Vega-Lite spec or similar JSON, render it
    if (graphData && typeof graphData === 'object') {
      // For now, display the JSON structure
      // In production, you would use vega-embed or another charting library
      const pre = document.createElement('pre')
      pre.style.cssText = 'padding: 20px; background: #f5f5f5; border-radius: 4px; overflow: auto; height: 100%;'
      pre.textContent = JSON.stringify(graphData, null, 2)
      container.appendChild(pre)
    } else if (graphData) {
      container.textContent = 'Graph data received'
    } else {
      container.innerHTML = '<div class="empty-graph">No graph data available</div>'
    }
  }

  const handlePresetSelect = (tileNumber, presetId) => {
    if (!presetId) {
      // Clear preset if empty selection
      setSelectedPresets(prev => {
        const newPresets = { ...prev }
        delete newPresets[tileNumber]
        return newPresets
      })
      return
    }
    
    const preset = PRESET_GRAPHS.find(p => p.id === presetId)
    if (preset) {
      setSelectedPresets(prev => ({
        ...prev,
        [tileNumber]: preset
      }))
      // Clear prompt for this tile
      setPrompts(prev => ({
        ...prev,
        [tileNumber]: ''
      }))
    }
  }

  const handlePromptSubmit = (tileNumber, prompt) => {
    if (prompt.trim() && onGraphRequest) {
      // Clear preset when submitting custom prompt
      setSelectedPresets(prev => {
        const newPresets = { ...prev }
        delete newPresets[tileNumber]
        return newPresets
      })
      // Clear the dropdown selection
      const selectElement = document.querySelector(`.tile:nth-child(${tileNumber}) .preset-selector`)
      if (selectElement) {
        selectElement.value = ''
      }
      onGraphRequest(tileNumber, prompt.trim())
    }
  }

  const handleKeyPress = (e, tileNumber, prompt) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handlePromptSubmit(tileNumber, prompt)
    }
  }

  const handlePromptChange = (tileNumber, value) => {
    setPrompts(prev => ({
      ...prev,
      [tileNumber]: value
    }))
  }

  const setRef = (tileNumber, element) => {
    if (!graphContainerRefs.current[tileNumber]) {
      graphContainerRefs.current[tileNumber] = { current: null }
    }
    graphContainerRefs.current[tileNumber].current = element
  }

  // Generate array of tile numbers
  const tileNumbers = Array.from({ length: tileCount }, (_, i) => i + 1)

  return (
    <div className={`tiles-container tiles-container--${tileCount}`}>
      {tileNumbers.map(tileNumber => (
        <div key={tileNumber} className="tile">
          {/* Preset Graph Selector */}
          <div className="tile-controls">
            <select
              className="preset-selector"
              value={selectedPresets[tileNumber]?.id || ''}
              onChange={(e) => handlePresetSelect(tileNumber, e.target.value)}
            >
              <option value="">Select a preset graph...</option>
              {PRESET_GRAPHS.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {/* Graph Container */}
          <div className="tile-graph">
            {selectedPresets[tileNumber] ? (
              <GraphRenderer 
                graphConfig={selectedPresets[tileNumber]}
              />
            ) : graphData[tileNumber] ? (
              // Custom graph rendering - will be handled by useEffect and renderGraph
              <div 
                className="custom-graph-container"
                ref={(el) => setRef(tileNumber, el)}
              >
                {/* Custom graph will be rendered by renderGraph function via ref */}
              </div>
            ) : (
              <div className="empty-graph">Select a preset graph or enter a custom prompt</div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="tile-prompt">
            <input
              type="text"
              className="prompt-input"
              placeholder="Enter your graph request here..."
              value={prompts[tileNumber] || ''}
              onChange={(e) => handlePromptChange(tileNumber, e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, tileNumber, prompts[tileNumber] || '')}
            />
            <button
              className="prompt-button"
              onClick={() => handlePromptSubmit(tileNumber, prompts[tileNumber] || '')}
              disabled={!prompts[tileNumber]?.trim()}
            >
              Generate
            </button>
            {(selectedPresets[tileNumber] || graphData[tileNumber]) && (
              <button
                className="save-button"
                onClick={() => handleSaveGraph(tileNumber)}
                title="Save this graph"
                style={{ display: 'inline-block', marginLeft: '8px' }}
              >
                💾 Save Graph
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default Tiles
