import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import confetti from 'canvas-confetti'
import '../styles/paymentModel.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Load Stripe publishable key
let stripePromise
async function getStripePromise() {
  if (!stripePromise) {
    try {
      const response = await fetch(`${API_BASE_URL}/payments/config`)
      const data = await response.json()
      stripePromise = loadStripe(data.publishableKey)
    } catch (error) {
      console.error('Failed to load Stripe config:', error)
    }
  }
  return stripePromise
}

function PaymentForm({ 
  amount, 
  name, 
  email, 
  billingAddress,
  setBillingAddress,
  billingCity,
  setBillingCity,
  billingState,
  setBillingState,
  billingZip,
  setBillingZip,
  onSuccess, 
  onError 
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // Create payment intent
      const amountInCents = Math.round(parseFloat(amount) * 100)
      const response = await fetch(`${API_BASE_URL}/payments/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents,
          currency: 'usd',
          description: 'Donation to CareerRise',
          name: name || undefined,
          email: email,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: name || undefined,
            email: email,
            address: {
              line1: billingAddress || undefined,
              city: billingCity || undefined,
              state: billingState || undefined,
              postal_code: billingZip || undefined,
              country: 'US',
            },
          },
        },
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent)
      }
    } catch (err) {
      setError(err.message)
      onError(err)
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="checkout-section">
        <h3 className="checkout-section-title">Payment Information</h3>
        
        <div className="payment-card-section">
          <label className="payment-label">Card Information <span className="required">*</span></label>
          <div className="payment-card-element">
            <CardElement options={cardElementOptions} />
          </div>
          <div className="payment-test-card-note">
            <strong>Test Card:</strong> Use <code>4242 4242 4242 4242</code> with any future expiry date, any CVC, and any ZIP code
          </div>
          {error && <div className="payment-error">{error}</div>}
        </div>

        <div className="billing-address-section">
          <h4 className="billing-title">Billing Address</h4>
          <div className="billing-form-grid">
            <div className="payment-input-group">
              <label className="payment-label" htmlFor="billing-address">
                Address <span className="required">*</span>
              </label>
              <input
                type="text"
                id="billing-address"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="payment-input"
                placeholder="123 Main St"
                required
              />
            </div>
            
            <div className="payment-input-group">
              <label className="payment-label" htmlFor="billing-city">
                City <span className="required">*</span>
              </label>
              <input
                type="text"
                id="billing-city"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
                className="payment-input"
                placeholder="Atlanta"
                required
              />
            </div>
            
            <div className="payment-input-group">
              <label className="payment-label" htmlFor="billing-state">
                State <span className="required">*</span>
              </label>
              <input
                type="text"
                id="billing-state"
                value={billingState}
                onChange={(e) => setBillingState(e.target.value.toUpperCase())}
                className="payment-input"
                placeholder="GA"
                maxLength="2"
                required
              />
            </div>
            
            <div className="payment-input-group">
              <label className="payment-label" htmlFor="billing-zip">
                ZIP Code <span className="required">*</span>
              </label>
              <input
                type="text"
                id="billing-zip"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
                className="payment-input"
                placeholder="30309"
                pattern="[0-9]{5}"
                maxLength="5"
                required
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="payment-submit-btn"
        disabled={isProcessing || !stripe}
      >
        {isProcessing ? 'Processing Payment...' : `Complete Donation of $${parseFloat(amount).toFixed(2)}`}
      </button>
    </form>
  )
}

function PaymentModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1) // 1: Amount, 2: Info, 3: Payment, 4: Success
  const [amount, setAmount] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [billingCity, setBillingCity] = useState('')
  const [billingState, setBillingState] = useState('')
  const [billingZip, setBillingZip] = useState('')
  const [stripePromise, setStripePromise] = useState(null)
  const [stripeLoading, setStripeLoading] = useState(false)
  const [stripeError, setStripeError] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const presetAmounts = [25, 50, 100, 250, 500]

  useEffect(() => {
    if (isOpen) {
      setStripeLoading(true)
      setStripeError(null)
      getStripePromise()
        .then((promise) => {
          setStripePromise(promise)
          setStripeLoading(false)
        })
        .catch((error) => {
          console.error('Failed to load Stripe:', error)
          setStripeError('Failed to load payment system. Please refresh the page.')
          setStripeLoading(false)
        })
      // Reset form when modal opens
      setStep(1)
      setAmount('')
      setCustomAmount('')
      setIsCustom(false)
      setName('')
      setEmail('')
      setBillingAddress('')
      setBillingCity('')
      setBillingState('')
      setBillingZip('')
      setPaymentSuccess(false)
    }
  }, [isOpen])

  const handleAmountSelect = (value) => {
    setAmount(value.toString())
    setIsCustom(false)
    setCustomAmount('')
  }

  const handleCustomAmountChange = (e) => {
    const value = e.target.value
    setCustomAmount(value)
    if (value) {
      setIsCustom(true)
      setAmount(value)
    } else {
      setIsCustom(false)
      setAmount('')
    }
  }

  const handleStep1Next = (e) => {
    e.preventDefault()
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid donation amount')
      return
    }
    setStep(2)
  }

  const handleStep2Next = (e) => {
    e.preventDefault()
    if (!email || !name) {
      alert('Please fill in all required fields')
      return
    }
    setStep(3)
  }

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentSuccess(true)
    setStep(4)
    
    // Trigger bright confetti celebration
    const duration = 4000
    const animationEnd = Date.now() + duration
    
    // Bright, vibrant colors
    const colors = ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#dcfce7', '#f0fdf4', '#15803d', '#ffffff', '#fbbf24', '#f59e0b']
    
    const defaults = { 
      startVelocity: 40, 
      spread: 360, 
      ticks: 100, 
      zIndex: 9999,
      colors: colors
    }

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 80 * (timeLeft / duration)
      
      // Launch bright confetti from left
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: colors
      })
      
      // Launch bright confetti from right
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: colors
      })
    }, 200)

    // Big bright burst from the center
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: colors,
      startVelocity: 50
    })
    
    // Additional bursts from top corners
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })
    }, 300)
  }

  const handlePaymentError = (error) => {
    console.error('Payment error:', error)
  }

  const handleClose = () => {
    if (step === 4) {
      // Reset everything on close after success
      setStep(1)
      setAmount('')
      setCustomAmount('')
      setIsCustom(false)
      setName('')
      setEmail('')
      setBillingAddress('')
      setBillingCity('')
      setBillingState('')
      setBillingZip('')
      setPaymentSuccess(false)
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="payment-modal-overlay" onClick={handleClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <button className="payment-modal-close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        
        <div className="payment-modal-content">
          <h2 className="payment-modal-title">Support CareerRise</h2>
          <p className="payment-modal-subtitle">
            Your donation empowers economic mobility in the Atlanta region
          </p>

          {/* Step Indicator */}
          {step < 4 && (
            <div className="checkout-steps">
              <div className={`checkout-step ${step >= 1 ? 'active' : ''}`}>
                <div className="checkout-step-number">1</div>
                <div className="checkout-step-label">Amount</div>
              </div>
              <div className="checkout-step-line"></div>
              <div className={`checkout-step ${step >= 2 ? 'active' : ''}`}>
                <div className="checkout-step-number">2</div>
                <div className="checkout-step-label">Information</div>
              </div>
              <div className="checkout-step-line"></div>
              <div className={`checkout-step ${step >= 3 ? 'active' : ''}`}>
                <div className="checkout-step-number">3</div>
                <div className="checkout-step-label">Payment</div>
              </div>
            </div>
          )}

          {/* Step 1: Amount Selection */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="payment-form">
              <div className="payment-amount-section">
                <label className="payment-label">Select or Enter Amount</label>
                <div className="payment-amount-buttons">
                  {presetAmounts.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={`payment-amount-btn ${amount === preset.toString() && !isCustom ? 'active' : ''}`}
                      onClick={() => handleAmountSelect(preset)}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
                <div className="payment-custom-amount">
                  <input
                    type="number"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    min="1"
                    step="0.01"
                    className="payment-custom-input"
                  />
                </div>
              </div>

              {amount && (
                <div className="payment-summary">
                  <div className="payment-summary-row">
                    <span>Donation Amount:</span>
                    <span className="payment-summary-amount">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="payment-submit-btn"
                disabled={!amount}
              >
                Continue
              </button>
            </form>
          )}

          {/* Step 2: Donor Information */}
          {step === 2 && (
            <form onSubmit={handleStep2Next} className="payment-form">
              <div className="payment-info-section">
                <h3 className="checkout-section-title">Donor Information</h3>
                
                <div className="payment-input-group">
                  <label className="payment-label" htmlFor="name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="payment-input"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="payment-input-group">
                  <label className="payment-label" htmlFor="email">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="payment-input"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="checkout-actions">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="payment-back-btn"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="payment-submit-btn"
                  disabled={!name || !email}
                >
                  Continue to Payment
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div>
              <div className="payment-summary checkout-review">
                <h3 className="checkout-section-title">Review Your Donation</h3>
                <div className="payment-summary-row">
                  <span>Donor Name:</span>
                  <span>{name}</span>
                </div>
                <div className="payment-summary-row">
                  <span>Email:</span>
                  <span>{email}</span>
                </div>
                <div className="payment-summary-row">
                  <span>Donation Amount:</span>
                  <span className="payment-summary-amount">${parseFloat(amount).toFixed(2)}</span>
                </div>
              </div>
              
              {stripeLoading && (
                <div className="payment-loading">
                  <p>Loading payment form...</p>
                </div>
              )}
              
              {stripeError && (
                <div className="payment-error">
                  {stripeError}
                  <br />
                  <small>Make sure your backend is running and Stripe keys are configured.</small>
                </div>
              )}
              
              {stripePromise && !stripeLoading && !stripeError && (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    amount={amount}
                    name={name}
                    email={email}
                    billingAddress={billingAddress}
                    setBillingAddress={setBillingAddress}
                    billingCity={billingCity}
                    setBillingCity={setBillingCity}
                    billingState={billingState}
                    setBillingState={setBillingState}
                    billingZip={billingZip}
                    setBillingZip={setBillingZip}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              )}
              
              {!stripeLoading && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="payment-back-btn"
                >
                  ← Back
                </button>
              )}
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="payment-success">
              <div className="payment-success-icon">✓</div>
              <h3 className="payment-success-title">Thank You!</h3>
              <p className="payment-success-message">
                Your donation of <strong>${parseFloat(amount).toFixed(2)}</strong> to CareerRise has been successfully processed.
              </p>
              <p className="payment-success-details">
                A confirmation email has been sent to <strong>{email}</strong>
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="payment-submit-btn"
              >
                Close
              </button>
            </div>
          )}

          <p className="payment-security-note">
            🔒 Secure payment processing powered by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
