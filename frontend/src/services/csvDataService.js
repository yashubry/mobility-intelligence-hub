// Service to load and process CSV data for preset graphs

const CSV_FILES = {
  poverty_rate: 'poverty_rate_atlanta.csv',
  unemployment_rate: 'unemployment_rate.csv',
  median_income: 'median_income.csv',
  k12_literacy: 'k12_literacy.csv',
  annual_jobs: 'annual_jobs.csv',
  credential_attainment: 'credential_attainment.csv',
  income_mobility: 'income_mobility_index.csv',
  cost_of_living: 'cost_of_living.csv'
}

// Preset graph configurations - ALL are line graphs with county filtering
export const PRESET_GRAPHS = [
  {
    id: 'poverty-trends',
    name: 'Poverty Rate Trends',
    csvKey: 'poverty_rate',
    yAxis: 'poverty_percentage',
    color: '#C62828',
    description: 'Poverty rates across Atlanta metro counties over time'
  },
  {
    id: 'unemployment-trends',
    name: 'Unemployment Rate Trends',
    csvKey: 'unemployment_rate',
    yAxis: 'value',
    color: '#1F4E79',
    description: 'Unemployment rates by county over time'
  },
  {
    id: 'median-income-trends',
    name: 'Median Household Income Trends',
    csvKey: 'median_income',
    yAxis: 'value',
    color: '#2e7d32',
    description: 'Income trends by county over time'
  },
  {
    id: 'literacy-trends',
    name: 'K-12 Literacy Rates',
    csvKey: 'k12_literacy',
    yAxis: 'literacy_percentage',
    color: '#7b1fa2',
    description: 'Literacy rates by county over time'
  },
  {
    id: 'annual-jobs-trends',
    name: 'Annual Jobs Available',
    csvKey: 'annual_jobs',
    yAxis: 'value',
    color: '#f57c00',
    description: 'Job availability by county over time'
  },
  {
    id: 'credential-trends',
    name: 'Credential Attainment',
    csvKey: 'credential_attainment',
    yAxis: 'value',
    color: '#00897b',
    description: 'Educational credential rates by county over time'
  },
  {
    id: 'income-mobility-trends',
    name: 'Income Mobility Index',
    csvKey: 'income_mobility',
    yAxis: 'value',
    color: '#5e35b1',
    description: 'Economic mobility trends by county'
  },
  {
    id: 'cost-of-living-trends',
    name: 'Cost of Living Index',
    csvKey: 'cost_of_living',
    yAxis: 'value',
    color: '#d32f2f',
    description: 'Cost of living changes by county over time'
  }
]

// Better CSV parser that handles quoted fields
const parseCSV = (text) => {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // Parse header
  const headerLine = lines[0]
  const headers = []
  let currentField = ''
  let inQuotes = false
  
  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      headers.push(currentField.trim())
      currentField = ''
    } else {
      currentField += char
    }
  }
  if (currentField) headers.push(currentField.trim())
  
  const data = []
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    const values = []
    currentField = ''
    inQuotes = false
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(currentField.trim())
        currentField = ''
      } else {
        currentField += char
      }
    }
    if (currentField) values.push(currentField.trim())
    
    const obj = {}
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || ''
      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      // Try to parse as number
      const numValue = parseFloat(value)
      obj[header] = isNaN(numValue) ? value : numValue
    })
    data.push(obj)
  }
  
  return data
}

// Extract county name from "Fulton County, Georgia" format
const extractCountyName = (nameField) => {
  if (!nameField) return null
  // Remove quotes if present
  let name = nameField.toString().replace(/^"|"$/g, '').trim()
  // Extract just the county name (before " County")
  const match = name.match(/^([^,]+)\s+County/)
  if (match) {
    return match[1] // Returns "Fulton", "Cobb", etc.
  }
  // Fallback: take everything before the comma
  const parts = name.split(',')
  return parts[0].replace(/\s+County/i, '').trim()
}

// Fetch CSV data
export const fetchCSVData = async (csvKey) => {
  const fileName = CSV_FILES[csvKey]
  if (!fileName) {
    console.error(`Unknown CSV key: ${csvKey}`)
    return []
  }
  
  try {
    const response = await fetch(`/data/${fileName}`)
    if (!response.ok) throw new Error(`Failed to fetch ${fileName}`)
    const text = await response.text()
    const parsed = parseCSV(text)
    console.log(`✅ Loaded ${fileName}:`, parsed.length, 'rows')
    console.log('Sample row:', parsed[0])
    return parsed
  } catch (error) {
    console.error(`❌ Error loading ${fileName}:`, error)
    return []
  }
}

// Process data for multi-line chart (one line per county)
export const processChartData = (rawData, config) => {
  console.log('🔄 Processing chart data...')
  console.log('Config:', config)
  console.log('Raw data count:', rawData?.length || 0)
  
  if (!rawData || rawData.length === 0) {
    console.error('❌ No raw data provided')
    return { chartData: [], counties: [], isMultiLine: true }
  }
  
  // Extract and normalize all data
  const normalized = []
  
  for (const row of rawData) {
    // Get county name
    let countyName = null
    if (row.county) {
      countyName = row.county
    } else if (row.NAME) {
      countyName = extractCountyName(row.NAME)
    }
    
    if (!countyName) {
      console.warn('⚠️ No county found in row:', row)
      continue
    }
    
    // Get year
    let year = row.year
    if (typeof year === 'string') {
      year = parseInt(year, 10)
    }
    if (!year || isNaN(year)) {
      console.warn('⚠️ Invalid year in row:', row)
      continue
    }
    
    // Get value based on yAxis config
    let value = null
    if (config.yAxis && row[config.yAxis] !== undefined) {
      value = parseFloat(row[config.yAxis])
    } else if (row.value !== undefined) {
      value = parseFloat(row.value)
    }
    
    if (value === null || isNaN(value)) {
      console.warn('⚠️ Invalid value in row:', row)
      continue
    }
    
    normalized.push({
      county: countyName,
      year: year,
      value: value
    })
  }
  
  console.log('✅ Normalized:', normalized.length, 'rows')
  if (normalized.length > 0) {
    console.log('Sample normalized:', normalized[0])
  }
  
  if (normalized.length === 0) {
    console.error('❌ No valid data after normalization')
    return { chartData: [], counties: [], isMultiLine: true }
  }
  
  // Get unique counties and years
  const counties = [...new Set(normalized.map(d => d.county))].sort()
  const years = [...new Set(normalized.map(d => d.year))].sort((a, b) => a - b)
  
  console.log('📊 Counties:', counties)
  console.log('📅 Years:', years)
  
  // Build chart data: one object per year, with a property for each county
  const chartData = years.map(year => {
    const dataPoint = { year: year }
    
    counties.forEach(county => {
      const record = normalized.find(d => d.county === county && d.year === year)
      dataPoint[county] = record ? record.value : null
    })
    
    return dataPoint
  })
  
  console.log('✅ Chart data created:', chartData.length, 'points')
  console.log('Sample chart point:', chartData[0])
  
  return { 
    chartData, 
    counties, 
    isMultiLine: true 
  }
}
