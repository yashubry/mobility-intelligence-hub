import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const atlantaCounties = [
  {
    name: 'Fulton County',
    literacyRate: 87.5,
    povertyRate: 14.2,
    educationalAttainment: 45.3,
    laborForceParticipation: 68.9,
    medianHouseholdIncome: 62500,
    center: [33.75, -84.35],
    radius: 8000,
  },
  {
    name: 'DeKalb County',
    literacyRate: 89.1,
    povertyRate: 12.8,
    educationalAttainment: 48.7,
    laborForceParticipation: 71.2,
    medianHouseholdIncome: 58900,
    center: [33.75, -84.1],
    radius: 7500,
  },
  {
    name: 'Cobb County',
    literacyRate: 91.5,
    povertyRate: 8.5,
    educationalAttainment: 52.1,
    laborForceParticipation: 73.5,
    medianHouseholdIncome: 72100,
    center: [33.85, -84.55],
    radius: 8500,
  },
  {
    name: 'Gwinnett County',
    literacyRate: 88.3,
    povertyRate: 9.8,
    educationalAttainment: 46.9,
    laborForceParticipation: 70.8,
    medianHouseholdIncome: 67800,
    center: [33.85, -84.1],
    radius: 8000,
  },
  {
    name: 'Clayton County',
    literacyRate: 82.4,
    povertyRate: 18.6,
    educationalAttainment: 38.2,
    laborForceParticipation: 65.3,
    medianHouseholdIncome: 45200,
    center: [33.55, -84.4],
    radius: 7000,
  },
  {
    name: 'Douglas County',
    literacyRate: 85.7,
    povertyRate: 11.3,
    educationalAttainment: 42.5,
    laborForceParticipation: 69.1,
    medianHouseholdIncome: 54100,
    center: [33.75, -84.7],
    radius: 7500,
  },
]

const getColorByMetric = (county, metric) => {
  const value = county[metric]
  let normalizedValue

  switch (metric) {
    case 'literacyRate':
      normalizedValue = (value - 75) / 20
      break
    case 'povertyRate':
      normalizedValue = 1 - (value - 5) / 20
      break
    case 'educationalAttainment':
      normalizedValue = (value - 30) / 25
      break
    case 'laborForceParticipation':
      normalizedValue = (value - 60) / 15
      break
    case 'medianHouseholdIncome':
      normalizedValue = (value - 40000) / 40000
      break
    default:
      normalizedValue = 0.5
  }

  normalizedValue = Math.max(0, Math.min(1, normalizedValue))
  const red = Math.round(255 * normalizedValue)
  const blue = Math.round(255 * (1 - normalizedValue))
  return `rgb(${red}, 100, ${blue})`
}

function MapContent({ selectedMetric }) {
  useMap() // Initialize map instance

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
          />
        )
      })}
    </>
  )
}

export default function MapTile() {
  const [selectedMetric, setSelectedMetric] = useState('literacyRate')
  const [isClient, setIsClient] = useState(false)
  const mapContainerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    setIsClient(true)
  }, [])


  const metricLabels = {
    literacyRate: 'Literacy Rate',
    povertyRate: 'Poverty Rate',
    educationalAttainment: 'Educational Attainment',
    laborForceParticipation: 'Labor Force Participation',
    medianHouseholdIncome: 'Median Household Income',
  }

  if (!isClient) {
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading map...</div>
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e0e7ed', background: '#f8fafc', flexShrink: 0, zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            border: '1px solid #ccc',
            fontSize: '12px',
            cursor: 'pointer',
            flex: 1,
            maxWidth: '200px',
          }}
        >
          {Object.entries(metricLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={() => navigate('/map')}
          style={{
            padding: '4px 12px',
            borderRadius: 4,
            border: '1px solid #0a6eb8',
            background: '#0a6eb8',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
          title="View full map"
        >
          View Full Map →
        </button>
      </div>
      <div 
        ref={mapContainerRef} 
        style={{ flex: 1, position: 'relative', minHeight: 400, width: '100%' }}
      >
        <MapContainer
          center={[33.75, -84.35]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          whenReady={() => {
            // Map is ready
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapContent selectedMetric={selectedMetric} />
        </MapContainer>
      </div>
    </div>
  )
}

