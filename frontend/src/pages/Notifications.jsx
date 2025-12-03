import { useState, useEffect } from 'react'
import '../styles/notifications.css'

const API_BASE = 'http://localhost:8000'

function Notifications() {
  const [preferences, setPreferences] = useState([])
  const [history, setHistory] = useState([])
  const [availableKPIs, setAvailableKPIs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPreference, setEditingPreference] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))

  // Form state
  const [formData, setFormData] = useState({
    kpi_id: '',
    threshold_value: '',
    threshold_operator: 'less_than',
    email: '',
    enabled: true,
    cooldown_hours: 24,
    date_range: '',
    alert_frequency: 'daily'
  })

  // Fetch available KPIs
  useEffect(() => {
    if (!token) return
    
    fetch(`${API_BASE}/api/kpis/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Failed to fetch KPIs')
      })
      .then(data => setAvailableKPIs(data))
      .catch(err => console.error('Error fetching KPIs:', err))
  }, [token])

  // Fetch notification preferences
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    
    fetch(`${API_BASE}/api/notifications/preferences`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.ok) return res.json()
        throw new Error('Failed to fetch preferences')
      })
      .then(data => {
        setPreferences(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching preferences:', err)
        setLoading(false)
      })
  }, [token])

  // Fetch notification history
  useEffect(() => {
    if (!token) return
    
    fetch(`${API_BASE}/api/notifications/history?limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.ok) return res.json()
        return []
      })
      .then(data => setHistory(data))
      .catch(err => console.error('Error fetching history:', err))
  }, [token])

  const handleCreatePreference = async (e) => {
    e.preventDefault()
    
    if (!token) {
      alert('Please login first')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/notifications/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          threshold_value: parseFloat(formData.threshold_value),
          cooldown_hours: parseInt(formData.cooldown_hours)
        })
      })

      if (response.ok) {
        const newPreference = await response.json()
        setPreferences([...preferences, newPreference])
        setShowForm(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Failed to create preference'}`)
      }
    } catch (error) {
      console.error('Error creating preference:', error)
      alert('Failed to create notification preference')
    }
  }

  const handleDeletePreference = async (kpiId) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this notification preference?')) return

    try {
      const response = await fetch(`${API_BASE}/api/notifications/preferences/${kpiId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok || response.status === 204) {
        setPreferences(preferences.filter(p => p.kpi_id !== kpiId))
      } else {
        alert('Failed to delete preference')
      }
    } catch (error) {
      console.error('Error deleting preference:', error)
      alert('Failed to delete notification preference')
    }
  }

  const resetForm = () => {
    setFormData({
      kpi_id: '',
      threshold_value: '',
      threshold_operator: 'less_than',
      email: '',
      enabled: true,
      cooldown_hours: 24,
      date_range: '',
      alert_frequency: 'daily'
    })
    setEditingPreference(null)
  }

  const getOperatorLabel = (operator) => {
    const labels = {
      'less_than': '<',
      'less_than_or_equal': '≤',
      'greater_than': '>',
      'greater_than_or_equal': '≥',
      'equal': '='
    }
    return labels[operator] || operator
  }

  if (!token) {
    return (
      <section className="page-section notifications-container">
        <div className="notifications-empty">
          <h1>Notification Settings</h1>
          <p>Please <a href="/login">login</a> to manage your notification preferences.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page-section notifications-container">
      <div className="notifications-header">
        <h1>Notification Settings</h1>
        <p>Set up email alerts for KPI threshold changes</p>
      </div>

      {/* Active Alerts Section */}
      <div className="notifications-section">
        <div className="section-header">
          <h2>Active Alerts</h2>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add New Alert'}
          </button>
        </div>

        {/* Create/Edit Form */}
        {showForm && (
          <form className="notification-form" onSubmit={handleCreatePreference}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="kpi_id">KPI</label>
                <select
                  id="kpi_id"
                  value={formData.kpi_id}
                  onChange={(e) => setFormData({...formData, kpi_id: e.target.value})}
                  required
                >
                  <option value="">Select a KPI</option>
                  {availableKPIs.map(kpi => (
                    <option key={kpi.kpi_id} value={kpi.kpi_id}>
                      {kpi.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="threshold_operator">Operator</label>
                <select
                  id="threshold_operator"
                  value={formData.threshold_operator}
                  onChange={(e) => setFormData({...formData, threshold_operator: e.target.value})}
                  required
                >
                  <option value="less_than">Less than (&lt;)</option>
                  <option value="less_than_or_equal">Less than or equal (≤)</option>
                  <option value="greater_than">Greater than (&gt;)</option>
                  <option value="greater_than_or_equal">Greater than or equal (≥)</option>
                  <option value="equal">Equal (=)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="threshold_value">Threshold Value</label>
                <input
                  type="number"
                  id="threshold_value"
                  value={formData.threshold_value}
                  onChange={(e) => setFormData({...formData, threshold_value: e.target.value})}
                  step="any"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cooldown_hours">Cooldown (hours)</label>
                <input
                  type="number"
                  id="cooldown_hours"
                  value={formData.cooldown_hours}
                  onChange={(e) => setFormData({...formData, cooldown_hours: e.target.value})}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="alert_frequency">Alert Frequency</label>
                <select
                  id="alert_frequency"
                  value={formData.alert_frequency}
                  onChange={(e) => setFormData({...formData, alert_frequency: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Alert
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false)
                  resetForm()
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Preferences List */}
        {loading ? (
          <p>Loading...</p>
        ) : preferences.length === 0 ? (
          <div className="notifications-empty">
            <p>No notification preferences set up yet.</p>
            <p>Click "Add New Alert" to create one.</p>
          </div>
        ) : (
          <div className="preferences-list">
            {preferences.map(pref => (
              <div key={pref.id} className="preference-card">
                <div className="preference-header">
                  <h3>{pref.kpi_id}</h3>
                  <span className={`status-badge ${pref.enabled ? 'enabled' : 'disabled'}`}>
                    {pref.enabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
                <div className="preference-details">
                  <p>
                    <strong>Alert when:</strong> Value {getOperatorLabel(pref.threshold_operator)} {pref.threshold_value}
                  </p>
                  <p><strong>Email:</strong> {pref.email}</p>
                  <p><strong>Cooldown:</strong> {pref.cooldown_hours} hours</p>
                  {pref.last_notified && (
                    <p><strong>Last notified:</strong> {new Date(pref.last_notified).toLocaleString()}</p>
                  )}
                </div>
                <div className="preference-actions">
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeletePreference(pref.kpi_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification History Section */}
      <div className="notifications-section">
        <h2>Notification History</h2>
        {history.length === 0 ? (
          <div className="notifications-empty">
            <p>No notifications sent yet.</p>
          </div>
        ) : (
          <div className="history-list">
            {history.map(notif => (
              <div key={notif.id} className="history-item">
                <div className="history-header">
                  <h4>{notif.kpi_name}</h4>
                  <span className="history-date">
                    {new Date(notif.sent_at).toLocaleString()}
                  </span>
                </div>
                <div className="history-details">
                  <p><strong>Value:</strong> {notif.actual_value}</p>
                  <p><strong>Threshold:</strong> {notif.threshold_value}</p>
                  <p><strong>Sent to:</strong> {notif.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Notifications
