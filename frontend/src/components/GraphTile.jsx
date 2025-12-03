import { useState, useEffect, useRef } from 'react'
import vegaEmbed from 'vega-embed'
import { saveGraph } from '../utils/graphStorage.js'
import GraphRenderer from './GraphRenderer.jsx'
import { PRESET_GRAPHS } from '../services/csvDataService.js'
import '../styles/tiles.css'

function GraphTile({ tileId, graphData, loading, error, onGraphRequest, onClearGraph }) {
  const [prompt, setPrompt] = useState('')
  const [selectedDataset, setSelectedDataset] = useState('movies-w-year.csv')
  const [saveMessage, setSaveMessage] = useState('')
  const [selectedPreset, setSelectedPreset] = useState(null)
  const graphContainerRef = useRef(null)

  // Available datasets
  const datasets = [
    { value: 'movies-w-year.csv', label: 'Movies' },
    { value: 'annual_jobs.csv', label: 'Annual Jobs' },
    { value: 'cost_of_living.csv', label: 'Cost of Living' },
    { value: 'credential_attainment.csv', label: 'Credential Attainment' },
    { value: 'income_mobility_index.csv', label: 'Income Mobility Index' },
    { value: 'k12_literacy.csv', label: 'K-12 Literacy' },
    { value: 'median_income.csv', label: 'Median Income' },
    { value: 'poverty_rate_atlanta.csv', label: 'Poverty Rate (Atlanta)' },
    { value: 'unemployment_rate.csv', label: 'Unemployment Rate' }
  ]

  // Render graph when graphData changes (only for custom graphs, not presets)
  useEffect(() => {
    // Skip rendering if a preset is selected - GraphRenderer handles preset rendering
    if (selectedPreset) {
      return
    }

    if (graphData?.vlSpec && graphContainerRef.current) {
      renderGraph(graphContainerRef.current, graphData.vlSpec)
    }
  }, [graphData, selectedPreset])

  const renderGraph = async (container, vlSpec) => {
    // Clear previous content
    container.innerHTML = ''

    try {
      // Log vlSpec structure before rendering
      console.log('🎨 Rendering graph with vlSpec:', {
        hasData: !!vlSpec.data,
        dataType: vlSpec.data?.url ? 'url' : vlSpec.data?.values ? 'inline' : 'none',
        originalDataUrl: vlSpec.data?.url,
        mark: vlSpec.mark,
        encoding: vlSpec.encoding ? Object.keys(vlSpec.encoding) : [],
        schema: vlSpec.$schema
      })

      // Fix relative URLs - convert to absolute backend URLs
      const fixedVlSpec = { ...vlSpec }
      if (fixedVlSpec.data?.url && !fixedVlSpec.data.url.startsWith('http')) {
        const originalUrl = fixedVlSpec.data.url
        fixedVlSpec.data.url = `http://localhost:7001/${fixedVlSpec.data.url}`
        console.log('🔧 Fixed relative data URL:', {
          original: originalUrl,
          fixed: fixedVlSpec.data.url
        })
      }

      // Validate vlSpec
      const validationIssues = []
      if (!fixedVlSpec.data) validationIssues.push('Missing data property')
      if (!fixedVlSpec.mark) validationIssues.push('Missing mark property')
      if (!fixedVlSpec.encoding) validationIssues.push('Missing encoding property')

      if (validationIssues.length > 0) {
        console.warn('⚠️ vlSpec validation issues:', validationIssues)
      }

      await vegaEmbed(container, fixedVlSpec, {
        actions: {
          export: true,
          source: false,
          compiled: false,
          editor: false
        },
        renderer: 'canvas'
      })

      console.log('✅ Graph rendered successfully')
    } catch (error) {
      console.error('❌ Vega rendering error:', {
        message: error.message,
        stack: error.stack,
        vlSpec: vlSpec
      })
      container.innerHTML = '<div class="graph-error">Failed to render visualization: ' + error.message + '</div>'
    }
  }

  const handlePresetSelect = (presetId) => {
    if (!presetId) {
      // Clear preset selection
      setSelectedPreset(null)
      return
    }

    const preset = PRESET_GRAPHS.find(p => p.id === presetId)
    if (preset) {
      setSelectedPreset(preset)
      // Clear custom prompt when selecting preset
      setPrompt('')
      // Clear parent's graphData to remove custom graph state
      if (onClearGraph) {
        onClearGraph(tileId)
      }
    }
  }

  const handleSubmit = () => {
    if (prompt.trim() && onGraphRequest) {
      // Clear preset when submitting custom prompt
      setSelectedPreset(null)
      onGraphRequest(tileId, prompt.trim(), selectedDataset)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSaveGraph = () => {
    // Check if we have either a preset or custom graph
    if (!selectedPreset && !graphData?.vlSpec) {
      setSaveMessage('No graph to save')
      setTimeout(() => setSaveMessage(''), 2000)
      return
    }

    try {
      if (selectedPreset) {
        // Save preset graph - store preset info for later rendering
        saveGraph({
          prompt: selectedPreset.name,
          preset: selectedPreset,
          dataset: 'preset-graph',
          isPreset: true
        })
      } else {
        // Save custom NL4DV graph
        saveGraph({
          prompt: graphData.prompt || prompt,
          vlSpec: graphData.vlSpec,
          dataset: graphData.dataset || 'movies-w-year.csv',
          isPreset: false
        })
      }
      setSaveMessage('Graph saved!')
      setTimeout(() => setSaveMessage(''), 2000)
    } catch (error) {
      setSaveMessage('Failed to save')
      setTimeout(() => setSaveMessage(''), 2000)
    }
  }

  return (
    <div className="tile graph-tile">
      <div className="tile-graph">
        {selectedPreset ? (
          <GraphRenderer graphConfig={selectedPreset} />
        ) : loading ? (
          <div className="graph-loading">
            <div className="loading-spinner"></div>
            <p>Generating visualization...</p>
          </div>
        ) : error ? (
          <div className="graph-error">{error}</div>
        ) : graphData?.vlSpec ? (
          <div
            className="custom-graph-container"
            ref={graphContainerRef}
          />
        ) : (
          <div className="empty-graph">
            <svg className="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
            <p>Select a preset graph or enter a query below</p>
          </div>
        )}
      </div>

      <div className="tile-controls">
        {(selectedPreset || graphData?.vlSpec) && (
          <div className="tile-actions">
            <button
              className="save-button"
              onClick={handleSaveGraph}
              title="Save this visualization"
            >
              {saveMessage || '💾 Save Graph'}
            </button>
            {!selectedPreset && graphData?.visType && (
              <span className="vis-info">
                {graphData.visType} chart {graphData.score && `(${Math.round(graphData.score * 100)}% match)`}
              </span>
            )}
          </div>
        )}

        <div className="tile-prompt">
          <select
            className="preset-selector"
            value={selectedPreset?.id || ''}
            onChange={(e) => handlePresetSelect(e.target.value)}
            disabled={loading}
          >
            <option value="">Select a preset graph...</option>
            {PRESET_GRAPHS.map(preset => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <select
            className="dataset-select"
            value={selectedDataset}
            onChange={(e) => setSelectedDataset(e.target.value)}
            disabled={loading || selectedPreset}
          >
            {datasets.map(ds => (
              <option key={ds.value} value={ds.value}>
                {ds.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="prompt-input"
            placeholder="Or enter a custom query..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || selectedPreset}
          />
          <button
            className="prompt-button"
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading || selectedPreset}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default GraphTile
