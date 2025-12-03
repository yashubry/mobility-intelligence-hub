import { useState, useEffect } from 'react'
import {
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { fetchCSVData, processChartData } from '../services/csvDataService'

// Color palette for multiple counties
const COLORS = [
  '#1F4E79', '#C62828', '#2e7d32', '#7b1fa2', '#f57c00',
  '#00897b', '#5e35b1', '#d32f2f', '#1976d2', '#388e3c'
]

function GraphRenderer({ graphConfig }) {
  const [data, setData] = useState([])
  const [counties, setCounties] = useState([])
  const [selectedCounties, setSelectedCounties] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const loadGraphData = async () => {
    if (!graphConfig?.csvKey) {
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const rawData = await fetchCSVData(graphConfig.csvKey)
      console.log('Raw data loaded:', rawData.length, 'rows')
      
      const processed = processChartData(rawData, graphConfig)
      console.log('Processed data:', processed)
      
      if (processed.chartData && processed.chartData.length > 0) {
        setData(processed.chartData)
        setCounties(processed.counties || [])
        // Select only Forsyth and Fulton by default
        const defaultCounties = new Set(['Forsyth', 'Fulton'])
        const availableCounties = processed.counties || []
        const selected = availableCounties.filter(c => defaultCounties.has(c))
        setSelectedCounties(new Set(selected))
      } else {
        console.warn('No chart data processed')
        setData([])
        setCounties([])
        setSelectedCounties(new Set())
      }
    } catch (error) {
      console.error('Error loading graph data:', error)
      setData([])
      setCounties([])
      setSelectedCounties(new Set())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (graphConfig && graphConfig.csvKey) {
      loadGraphData()
    } else {
      setData([])
      setCounties([])
      setSelectedCounties(new Set())
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphConfig?.id, graphConfig?.csvKey]) // Re-run when graph config changes

  useEffect(() => {
    // When counties are loaded, select only Forsyth and Fulton by default if none selected
    if (counties.length > 0 && selectedCounties.size === 0) {
      const defaultCounties = new Set(['Forsyth', 'Fulton'])
      const selected = counties.filter(c => defaultCounties.has(c))
      setSelectedCounties(new Set(selected))
    }
  }, [counties, selectedCounties.size])

  const toggleCounty = (county) => {
    setSelectedCounties(prev => {
      const newSet = new Set(prev)
      if (newSet.has(county)) {
        newSet.delete(county)
      } else {
        newSet.add(county)
      }
      return newSet
    })
  }

  const selectAllCounties = () => {
    setSelectedCounties(new Set(counties))
  }

  const deselectAllCounties = () => {
    setSelectedCounties(new Set())
  }

  if (!graphConfig) {
    return (
      <div className="empty-graph">
        <p>No graph selected</p>
        <p className="empty-graph-hint">Choose a preset graph from the dropdown</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="empty-graph">
        <p>Loading graph data...</p>
        <p style={{fontSize: '12px', color: '#999'}}>Graph: {graphConfig?.name}</p>
      </div>
    )
  }

  if (data.length === 0 || counties.length === 0) {
    return (
      <div className="empty-graph">
        <p>No data available</p>
        <p style={{fontSize: '12px', color: '#999'}}>
          Data rows: {data.length}, Counties: {counties.length}
        </p>
        <p style={{fontSize: '12px', color: '#999'}}>
          Check console for errors (F12)
        </p>
      </div>
    )
  }

  // Filter to only selected counties
  const visibleCounties = counties.filter(c => selectedCounties.has(c))

  console.log('Rendering chart with:', {
    dataPoints: data.length,
    counties: counties.length,
    visibleCounties: visibleCounties.length,
    sampleData: data[0]
  })

  if (visibleCounties.length === 0 && counties.length > 0) {
    return (
      <div className="graph-renderer">
        <div className="graph-header">
          <div className="graph-title">{graphConfig.name}</div>
          <div className="county-filter">
            <div className="county-filter-header">
              <span>Filter Counties:</span>
              <div className="county-filter-actions">
                <button 
                  className="filter-button-small"
                  onClick={selectAllCounties}
                >
                  All
                </button>
              </div>
            </div>
            <div className="county-checkboxes">
              {counties.map((county, index) => (
                <label key={county} className="county-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCounties.has(county)}
                    onChange={() => toggleCounty(county)}
                  />
                  <span 
                    className="county-color-indicator"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  <span>{county}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="empty-graph">
          <p>Please select at least one county to display</p>
        </div>
      </div>
    )
  }

  const chartProps = {
    data: data,
    margin: { top: 10, right: 30, left: 20, bottom: 60 }
  }

  return (
    <div className="graph-renderer" style={{ width: '100%', minHeight: '500px', display: 'flex', flexDirection: 'column' }}>
      <div className="graph-header">
        <div className="graph-title">{graphConfig.name}</div>
        
        {/* County Filter */}
        <div className="county-filter">
          <div className="county-filter-header">
            <span>Filter Counties:</span>
            <div className="county-filter-actions">
              <button 
                className="filter-button-small"
                onClick={selectAllCounties}
              >
                All
              </button>
              <button 
                className="filter-button-small"
                onClick={deselectAllCounties}
              >
                None
              </button>
            </div>
          </div>
          <div className="county-checkboxes">
            {counties.map((county, index) => (
              <label key={county} className="county-checkbox">
                <input
                  type="checkbox"
                  checked={selectedCounties.has(county)}
                  onChange={() => toggleCounty(county)}
                />
                <span 
                  className="county-color-indicator"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></span>
                <span>{county}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '700px', marginTop: '4px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data}
            margin={{ top: 20, right: 50, left: 20, bottom: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
            <XAxis 
              dataKey="year" 
              stroke="#64748b"
              style={{ fontSize: '14px', fontWeight: 500 }}
              tick={{ fill: '#475569', fontSize: 14 }}
              label={{ 
                value: 'Year', 
                position: 'insideBottom', 
                offset: -20,
                style: { fontSize: '15px', fontWeight: 600, fill: '#334155' }
              }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '14px', fontWeight: 500 }}
              tick={{ fill: '#475569', fontSize: 14 }}
              width={60}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                fontSize: '13px'
              }}
              labelStyle={{ 
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '4px'
              }}
            />
            <Legend 
              wrapperStyle={{ 
                paddingTop: '16px',
                fontSize: '13px'
              }}
              iconType="line"
              iconSize={16}
            />
            {visibleCounties.map((county, index) => {
              const colorIndex = counties.indexOf(county)
              return (
                <Line 
                  key={county}
                  type="monotone" 
                  dataKey={county}
                  name={county}
                  stroke={COLORS[colorIndex % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 5, strokeWidth: 2.5, fill: 'white' }}
                  activeDot={{ r: 8, strokeWidth: 2.5 }}
                  connectNulls
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default GraphRenderer
