import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logo from '../assets/CareerRiseLogo1.png'
import './NavBar.css'

const publicLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/map', label: 'Map' },
  { to: '/careerbot', label: 'CareerBot' },
  { to: '/login', label: 'Login' },
]

const authenticatedLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/map', label: 'Map' },
  { to: '/careerbot', label: 'CareerBot' },
  { to: '/saved-graphs', label: 'Saved Graphs' },
  { to: '/notifications', label: 'Notifications' },
]

function NavBar() {
  const navigate = useNavigate()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    // Check if user has a token
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

    // Listen for storage changes (for cross-tab logout)
    const handleStorageChange = () => {
      const token = localStorage.getItem('token')
      setIsLoggedIn(!!token)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setShowLogoutModal(false)
    window.dispatchEvent(new Event('storage'))
    navigate('/')
  }

  const handleLogoutCancel = () => {
    setShowLogoutModal(false)
  }

  const links = isLoggedIn ? authenticatedLinks : publicLinks

  return (
    <header className="cr-nav">
      <div className="cr-nav__inner">
        <div className="cr-nav__brand">
          <img src={logo} alt="CareerRise logo" className="cr-nav__logo" />
          <span>CareerRise</span>
        </div>
        <nav className="cr-nav__links">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                ['cr-nav__link', isActive ? 'cr-nav__link--active' : ''].join(' ').trim()
              }
            >
              {label}
            </NavLink>
          ))}
          {isLoggedIn && (
            <button onClick={handleLogoutClick} className="cr-nav__link cr-nav__logout">
              Logout
            </button>
          )}
        </nav>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="logout-modal-overlay" onClick={handleLogoutCancel}>
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Are you sure?</h2>
            <p>Do you want to log out of your account?</p>
            <div className="logout-modal-buttons">
              <button onClick={handleLogoutCancel} className="logout-modal-cancel">
                Cancel
              </button>
              <button onClick={handleLogoutConfirm} className="logout-modal-confirm">
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default NavBar
