import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/login.css'

const API_URL = 'http://localhost:8000'

function Login() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token is valid by checking with backend
      fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          // Token is valid, redirect to dashboard
          navigate('/dashboard')
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('token')
        }
      })
      .catch(() => {
        // Error checking token, remove it
        localStorage.removeItem('token')
      })
    }
  }, [navigate])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (isSignUp && !username) {
      newErrors.username = 'Username is required'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (isSignUp) {
      // For signup, collect all password requirements that are missing
      const passwordErrors = []
      if (password.length < 8) {
        passwordErrors.push('at least 8 characters')
      }
      if (!/(?=.*\d)/.test(password)) {
        passwordErrors.push('at least one digit')
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        passwordErrors.push('at least one uppercase letter')
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain: ${passwordErrors.join(', ')}`
      }
    } else if (password.length < 8) {
      // For login, just check minimum length
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (isSignUp) {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    
    if (validateForm()) {
      setIsLoading(true)
      
      try {
        if (isSignUp) {
          // Sign up
          const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              username,
              password,
              subscribed: subscribed ? 1 : 0
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.detail || 'Sign up failed')
          }

          // After successful signup, log the user in
          const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          })

          const loginData = await loginResponse.json()

          if (!loginResponse.ok) {
            throw new Error(loginData.detail || 'Login after signup failed')
          }

          // Store token and redirect
          localStorage.setItem('token', loginData.access_token)
          // Trigger storage event for same-window update
          window.dispatchEvent(new Event('storage'))
          navigate('/dashboard')
        } else {
          // Login
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.detail || 'Login failed')
          }

          // Store token and redirect
          localStorage.setItem('token', data.access_token)
          // Trigger storage event for same-window update
          window.dispatchEvent(new Event('storage'))
          navigate('/dashboard')
        }
      } catch (error) {
        setApiError(error.message)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setEmail('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
    setErrors({})
    setApiError('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setSubscribed(false)
    setShowTooltip(false)
  }

  return (
    <section className="page-section login-container">
      <div className="login-card">
        <h1>{isSignUp ? 'Sign Up' : 'Login'}</h1>
        <p className="login-subtitle">
          {isSignUp 
            ? 'Create a new account to get started' 
            : 'Welcome back! Please login to your account'}
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          {apiError && (
            <div className="api-error-message">
              {apiError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? 'input-error' : ''}
              placeholder="Enter your email"
              disabled={isLoading}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={errors.username ? 'input-error' : ''}
                placeholder="Enter your username"
                disabled={isLoading}
              />
              {errors.username && <span className="error-message">{errors.username}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={errors.password ? 'input-error' : ''}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
            {isSignUp && (
              <div className="password-requirements">
                <p className="requirements-title">Password must contain:</p>
                <ul className="requirements-list">
                  <li className={password.length >= 8 ? 'requirement-met' : ''}>
                    At least 8 characters
                  </li>
                  <li className={/(?=.*\d)/.test(password) ? 'requirement-met' : ''}>
                    At least one digit (0-9)
                  </li>
                  <li className={/(?=.*[A-Z])/.test(password) ? 'requirement-met' : ''}>
                    At least one uppercase letter (A-Z)
                  </li>
                </ul>
              </div>
            )}
          </div>

          {isSignUp && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          )}

          {isSignUp && (
            <div className="subscription-container">
              <label className="subscription-label">
                <input
                  type="checkbox"
                  checked={subscribed}
                  onChange={(e) => setSubscribed(e.target.checked)}
                  disabled={isLoading}
                  className="subscription-checkbox"
                />
                <span>Subscribe to weekly updates</span>
                <div className="info-icon-wrapper">
                  <button
                    type="button"
                    className="info-icon"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                    aria-label="Subscription information"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  </button>
                  {showTooltip && (
                    <div className="tooltip">
                      If you subscribe, you consent to be sent weekly data updates from the dashboard.
                    </div>
                  )}
                </div>
              </label>
            </div>
          )}

          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <div className="toggle-mode">
          <p>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button type="button" onClick={toggleMode} className="toggle-link">
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </section>
  )
}

export default Login
 