/**
 * INTERACTIVE MAP WITH HEATMAP VISUALIZATION FOR ATLANTA AREA COUNTIES
 * 
 * SETUP STEPS:
 * 1. Installed mapping libraries:
 *    - npm install "react-leaflet@^4.2.1" leaflet
 *    - react-leaflet is a React wrapper for Leaflet (open-source mapping library)
 *    - leaflet provides the core mapping functionality
 * 
 * 2. Imported necessary components:
 *    - MapContainer: Main container component that initializes the map
 *    - TileLayer: Displays the base map tiles (OpenStreetMap)
 *    - Circle: Renders circular shapes for counties on the map
 *    - useMap: React hook to access the Leaflet map instance
 * 
 * 3. Fixed Leaflet icon issue:
 *    - Leaflet's default marker icons don't work well with React/Vite
 *    - Manually configured icon URLs to use CDN versions
 * 
 * 4. Created sample county data:
 *    - Defined 6 Atlanta-area counties with sample economic metrics
 *    - Each county has: name, center (latitude/longitude), radius, and 5 metrics
 *    - Metrics: literacy rate, poverty rate, educational attainment, 
 *      labor force participation, median household income
 * 
 * 5. Implemented circle rendering:
 *    - Each county is rendered as a Circle component with center and radius
 *    - Circles are color-coded based on the selected metric
 * 
 * 6. Built interactive features:
 *    - Hover functionality: Shows county info panel when hovering over counties
 *    - Heatmap visualization: Colors counties based on selected metric
 *    - Metric switching: Dropdown to change which metric is visualized
 *    - Color normalization: Converts metric values to 0-1 scale for consistent coloring
 * 
 * HOW IT WORKS:
 * - The map is centered on Atlanta (coordinates: 33.749, -84.388)
 * - Counties are rendered as colored circles
 * - Color intensity represents the metric value (blue = low, red = high)
 * - Hovering over a county triggers mouseover event, showing detailed stats
 * - Selecting a different metric recalculates colors for all counties
 */

import { useState, useRef } from 'react'
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

/**
 * FIX FOR LEAFLET ICON ISSUE IN REACT/VITE
 * 
 * Leaflet's default marker icons use relative paths that don't work with React bundlers.
 * We override the icon configuration to use CDN-hosted images instead.
 * This ensures markers (if we add them later) will display correctly.
 */
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

/**
 * ATLANTA AREA COUNTIES DATA
 * 
 * This is sample data for demonstration. In production, you would:
 * 1. Fetch real county boundary data from a GeoJSON API or shapefile
 * 2. Get actual economic metrics from Census Bureau or similar data source
 * 3. Use precise county center coordinates and appropriate radius sizes
 * 
 * Each county object contains:
 * - name: County name
 * - center: [latitude, longitude] coordinates for the circle center
 * - radius: Radius in meters for the circle size
 * - Five economic metrics as percentages or dollar amounts
 */
const atlantaCounties = [
  {
    name: 'Fulton County',
    literacyRate: 87.5,
    povertyRate: 14.2,
    educationalAttainment: 45.3,
    laborForceParticipation: 68.9,
    medianHouseholdIncome: 62500,
    center: [33.75, -84.35], // Atlanta center
    radius: 8000, // 8km radius (reduced from 15km)
  },
  {
    name: 'DeKalb County',
    literacyRate: 89.1,
    povertyRate: 12.8,
    educationalAttainment: 48.7,
    laborForceParticipation: 71.2,
    medianHouseholdIncome: 58900,
    center: [33.75, -84.1], // East of Atlanta
    radius: 7500, // 7.5km radius (reduced from 14km)
  },
  {
    name: 'Cobb County',
    literacyRate: 91.5,
    povertyRate: 8.5,
    educationalAttainment: 52.1,
    laborForceParticipation: 73.5,
    medianHouseholdIncome: 72100,
    center: [33.85, -84.55], // Northwest of Atlanta
    radius: 8500, // 8.5km radius (reduced from 16km)
  },
  {
    name: 'Gwinnett County',
    literacyRate: 88.3,
    povertyRate: 9.8,
    educationalAttainment: 46.9,
    laborForceParticipation: 70.8,
    medianHouseholdIncome: 67800,
    center: [33.85, -84.1], // Northeast of Atlanta
    radius: 8000, // 8km radius (reduced from 15km)
  },
  {
    name: 'Clayton County',
    literacyRate: 82.4,
    povertyRate: 18.6,
    educationalAttainment: 38.2,
    laborForceParticipation: 65.3,
    medianHouseholdIncome: 45200,
    center: [33.55, -84.4], // South of Atlanta
    radius: 7000, // 7km radius (reduced from 13km)
  },
  {
    name: 'Douglas County',
    literacyRate: 85.7,
    povertyRate: 11.3,
    educationalAttainment: 42.5,
    laborForceParticipation: 69.1,
    medianHouseholdIncome: 54100,
    center: [33.75, -84.7], // West of Atlanta
    radius: 7500, // 7.5km radius (reduced from 14km)
  },
]

/**
 * GET COLOR BASED ON METRIC VALUE
 * 
 * This function normalizes metric values to a 0-1 scale, then converts to RGB color.
 * Used by both the circle rendering and the legend.
 * 
 * Normalization process:
 * 1. Each metric has different ranges (e.g., literacy: 75-95%, income: $40k-$80k)
 * 2. We normalize each to 0-1 scale using min/max expected values
 * 3. For poverty rate, we invert (lower poverty = better = higher color value)
 * 4. Clamp values between 0 and 1 to prevent out-of-range colors
 * 
 * Color scheme:
 * - Blue (rgb(0, 100, 255)) = Low values
 * - Red (rgb(255, 100, 0)) = High values
 * - Gradient in between
 * 
 * @param {Object} county - County object with metrics
 * @param {string} metric - Metric key to visualize
 * @returns {string} RGB color string
 */
const getColorByMetric = (county, metric) => {
  const value = county[metric]
  let normalizedValue

  // Normalize each metric to 0-1 scale based on expected ranges
  switch (metric) {
    case 'literacyRate':
      // Expected range: 75-95%
      normalizedValue = (value - 75) / 20
      break
    case 'povertyRate':
      // Expected range: 5-25%, but we invert (lower poverty = better)
      normalizedValue = 1 - (value - 5) / 20
      break
    case 'educationalAttainment':
      // Expected range: 30-55%
      normalizedValue = (value - 30) / 25
      break
    case 'laborForceParticipation':
      // Expected range: 60-75%
      normalizedValue = (value - 60) / 15
      break
    case 'medianHouseholdIncome':
      // Expected range: $40k-$80k
      normalizedValue = (value - 40000) / 40000
      break
    default:
      normalizedValue = 0.5
  }

  // Clamp to 0-1 range to prevent invalid colors
  normalizedValue = Math.max(0, Math.min(1, normalizedValue))

  // Convert normalized value to RGB color
  // Red increases with value, blue decreases
  const red = Math.round(255 * normalizedValue)
  const blue = Math.round(255 * (1 - normalizedValue))
  return `rgb(${red}, 100, ${blue})`
}

/**
 * MAP CONTENT COMPONENT
 * 
 * This component handles the interactive map layer rendering.
 * It must be inside MapContainer to use the useMap hook.
 * 
 * Responsibilities:
 * 1. Render Circle components for each county
 * 2. Calculate colors based on selected metric
 * 3. Apply styles to county circles
 * 4. Handle hover events (mouseover/mouseout)
 */
function MapContent({ selectedMetric, onCountyHover }) {
  const map = useMap() // Get the Leaflet map instance (for future map manipulations)
  const hoverTimeoutRef = useRef(null)
  const currentHoveredCountyRef = useRef(null)

  /**
   * RENDER COUNTY CIRCLES
   * 
   * We render each county as a Circle component with:
   * - center: [latitude, longitude] position
   * - radius: Size in meters
   * - fillColor: Color based on selected metric
   * - Event handlers for hover interactions
   * 
   * Note: We render in original order but use improved event handling to prevent glitches
   */
  return (
    <>
      {atlantaCounties.map((county, index) => {
        const fillColor = getColorByMetric(county, selectedMetric)
        
        return (
          <Circle
            key={index}
            center={county.center}
            radius={county.radius}
            pathOptions={{
              fillColor: fillColor,
              fillOpacity: 0.7,
              color: '#333',
              weight: 2,
              opacity: 0.8,
            }}
            interactive={true}
            bubblingMouseEvents={false}
            eventHandlers={{
              mouseover: (e) => {
                const layer = e.target
                // Clear any pending timeout immediately
                if (hoverTimeoutRef.current) {
                  clearTimeout(hoverTimeoutRef.current)
                  hoverTimeoutRef.current = null
                }
                // Prevent event bubbling
                L.DomEvent.stopPropagation(e)
                
                // Track which county is currently hovered
                currentHoveredCountyRef.current = county.name
                
                // Highlight the circle on hover
                layer.setStyle({
                  fillOpacity: 0.9, // Increase opacity
                  weight: 3, // Thicker border
                })
                // Show county info in the hover panel immediately
                onCountyHover({
                  name: county.name,
                  literacyRate: county.literacyRate,
                  povertyRate: county.povertyRate,
                  educationalAttainment: county.educationalAttainment,
                  laborForceParticipation: county.laborForceParticipation,
                  medianHouseholdIncome: county.medianHouseholdIncome,
                })
              },
              mouseout: (e) => {
                const layer = e.target
                // Prevent event bubbling
                L.DomEvent.stopPropagation(e)
                
                // Store the county name for this mouseout
                const leavingCounty = county.name
                
                // Reset to normal styling
                layer.setStyle({
                  fillOpacity: 0.7,
                  weight: 2,
                })
                
                // Use a delay to prevent flickering when moving between overlapping circles
                // Only clear if we're still leaving this specific county
                hoverTimeoutRef.current = setTimeout(() => {
                  // Only clear if we haven't moved to a different county
                  if (currentHoveredCountyRef.current === leavingCounty || currentHoveredCountyRef.current === null) {
                    currentHoveredCountyRef.current = null
                    onCountyHover(null)
                  }
                  hoverTimeoutRef.current = null
                }, 300)
              },
              click: (e) => {
                // Prevent map click events when clicking on circles
                L.DomEvent.stopPropagation(e)
              },
            }}
          />
        )
      })}
    </>
  )
}

/**
 * MAIN MAP PAGE COMPONENT
 * 
 * This is the main component that renders the entire map page.
 * It manages:
 * - Selected metric state (which metric to visualize)
 * - Hovered county state (which county info to display)
 * - UI elements (dropdown, info panel, legend)
 */
export default function MapPage() {
  // State for which metric is currently being visualized
  const [selectedMetric, setSelectedMetric] = useState('literacyRate')
  
  // State for which county is being hovered (null when none)
  const [hoveredCounty, setHoveredCounty] = useState(null)

  // Mapping of metric keys to display labels
  const metricLabels = {
    literacyRate: 'Literacy Rate',
    povertyRate: 'Poverty Rate',
    educationalAttainment: 'Educational Attainment',
    laborForceParticipation: 'Labor Force Participation',
    medianHouseholdIncome: 'Median Household Income',
  }

  /**
   * FORMAT VALUE FOR DISPLAY
   * 
   * Formats numeric values based on metric type:
   * - Income: Adds dollar sign and comma separators
   * - Percentages: Adds % symbol
   * 
   * @param {number} value - Numeric value to format
   * @param {string} metric - Metric key
   * @returns {string} Formatted string
   */
  const formatValue = (value, metric) => {
    if (metric === 'medianHouseholdIncome') {
      return `$${value.toLocaleString()}`
    }
    return `${value.toFixed(1)}%`
  }

  return (
    <section className="page-section" style={{ padding: 24 }}>
      <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 600 }}>Map</h1>
      <p style={{ color: "#555", marginTop: 6 }}>
        This map will visualize <strong>Atlanta</strong> and its neighboring counties to highlight key indicators of <strong>economic mobility</strong>. You'll be able to switch layers to view metrics such as <em>poverty rate</em>, <em>educational attainment</em>, <em>labor force participation</em>, and <em>median household income</em>, then compare patterns across counties and neighborhoods.
      </p>

      {/* METRIC SELECTOR
          Allows users to switch which metric is visualized on the map.
          Changing this updates selectedMetric state, which triggers a re-render
          with new colors for all counties. */}
      <div style={{ 
        marginTop: 16, 
        marginBottom: 16,
      }}>
        <label style={{ marginRight: 12, fontWeight: 500 }}>View Metric:</label>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: 4,
            border: '1px solid #ccc',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          {Object.entries(metricLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* MAP CONTAINER
          This div wraps the Leaflet map and provides styling.
          The MapContainer component initializes the Leaflet map instance.
          Center coordinates: [latitude, longitude] for Atlanta, GA
          Zoom level: 10 (good for viewing multiple counties) */}
      <div
        style={{
          marginTop: 16,
          width: "100%",
          height: "60vh", // 60% of viewport height
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          overflow: 'hidden', // Hide map controls that extend beyond border
          position: 'relative', // For absolute positioning of popup
        }}
      >
        {/* HOVER INFO POPUP
            This popup appears when a user hovers over a county.
            It displays all metrics for the hovered county.
            Positioned absolutely so it doesn't affect map layout.
            Only renders when hoveredCounty state is not null. */}
        {hoveredCounty && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'white',
              padding: 16,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              minWidth: 280,
              maxWidth: 320,
              zIndex: 1000,
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 12, fontSize: '1.1rem', color: '#333' }}>
              {hoveredCounty.name}
            </h3>
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#555' }}>
              <div><strong>Literacy Rate:</strong> {hoveredCounty.literacyRate.toFixed(1)}%</div>
              <div><strong>Poverty Rate:</strong> {hoveredCounty.povertyRate.toFixed(1)}%</div>
              <div><strong>Educational Attainment:</strong> {hoveredCounty.educationalAttainment.toFixed(1)}%</div>
              <div><strong>Labor Force Participation:</strong> {hoveredCounty.laborForceParticipation.toFixed(1)}%</div>
              <div><strong>Median Household Income:</strong> ${hoveredCounty.medianHouseholdIncome.toLocaleString()}</div>
            </div>
          </div>
        )}
        <MapContainer
          center={[33.75, -84.35]} // Atlanta, GA coordinates - centered on the circles
          zoom={11} // Zoom level (higher = more zoomed in) - increased to show circles closer
          style={{ height: '100%', width: '100%' }}
        >
          {/* BASE MAP TILE LAYER
              OpenStreetMap provides free map tiles.
              This is the background map that shows streets, labels, etc.
              The GeoJSON layer (counties) renders on top of this. */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* COUNTY CIRCLES LAYER
              MapContent component renders the interactive county circles.
              It receives:
              - selectedMetric: Which metric to color-code by
              - onCountyHover: Callback function to update hover state */}
          <MapContent
            selectedMetric={selectedMetric}
            onCountyHover={setHoveredCounty}
          />
        </MapContainer>
      </div>

      {/* COLOR LEGEND
          Shows users how to interpret the color coding.
          Displays a gradient from blue (low) to red (high).
          Also shows which metric is currently active. */}
      <div style={{ marginTop: 12, fontSize: '0.85rem', color: '#666' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>Lower values</span>
          {/* Generate color swatches matching the map's color scale */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[0, 0.25, 0.5, 0.75, 1].map((val) => (
              <div
                key={val}
                style={{
                  width: 30,
                  height: 16,
                  background: `rgb(${Math.round(255 * val)}, 100, ${Math.round(255 * (1 - val))})`,
                  border: '1px solid #ccc',
                }}
              />
            ))}
          </div>
          <span>Higher values</span>
        </div>
        <div style={{ marginTop: 4, fontStyle: 'italic' }}>
          Currently showing: <strong>{metricLabels[selectedMetric]}</strong>
        </div>
      </div>
    </section>
  )
}
