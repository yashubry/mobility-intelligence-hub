import { Routes, Route } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Map from './pages/Map.jsx'
import SavedGraphs from './pages/SavedGraphs.jsx'
import CareerBot from './pages/CareerBot.jsx'
import Login from './pages/login.jsx'
import Notifications from './pages/Notifications.jsx'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/map" element={<Map />} />
          <Route path="/careerbot" element={<CareerBot />} />
          <Route path="/saved-graphs" element={
            <ProtectedRoute>
              <SavedGraphs />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
