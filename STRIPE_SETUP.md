# Stripe Payment Setup Guide

This guide will help you set up Stripe payments for the CareerRise donation system.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Backend server running
3. Frontend server running

## Step 1: Get Your Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Make sure you're in **Test mode** (toggle in the top right)
3. Go to **Developers** → **API keys**
4. Copy your keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

## Step 2: Set Up Backend Environment Variables

1. Navigate to the `backend` directory
2. Create or edit the `.env` file:
   ```bash
   cd backend
   nano .env  # or use your preferred editor
   ```

3. Add your Stripe keys:
   ```
   SECRET_KEY=your-jwt-secret-key-here
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

   **Note:** The webhook secret is optional for basic testing. You'll need it if you want to handle payment confirmations via webhooks.

4. Save the file

## Step 3: Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This will install the `stripe` package along with other dependencies.

## Step 4: Install Frontend Dependencies

```bash
cd frontend
npm install
```

This will install all frontend dependencies.

## Step 5: Start the Servers

### Backend (Terminal 1):
```bash
cd backend
uvicorn main:app --reload
```

The backend should be running at `http://localhost:8000`

### Frontend (Terminal 2):
```bash
cd frontend
npm run dev
```

The frontend should be running at `http://localhost:5173` (or another port if 5173 is taken)

## Step 6: Test the Payment Flow

1. Open your browser to the frontend URL (usually `http://localhost:5173`)
2. Click the donation button
3. Enter a test amount (e.g., $25)
4. Enter your email
5. Click "Donate"
6. You'll be redirected to Stripe Checkout
7. Use Stripe's test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC
   - Any ZIP code
8. Complete the payment
9. You should be redirected back to the home page

## Testing Different Scenarios

### Successful Payment
- Use card: `4242 4242 4242 4242`
- Payment will complete and redirect back to home page

### Declined Payment
- Use card: `4000 0000 0000 0002`
- Payment will be declined

### Requires Authentication
- Use card: `4000 0025 0000 3155`
- Will require 3D Secure authentication

## Production Setup

When you're ready to go live:

1. Switch to **Live mode** in Stripe Dashboard
2. Get your **live** API keys (they start with `pk_live_` and `sk_live_`)
3. Update your `.env` file with live keys
4. Update your webhook endpoint in Stripe Dashboard:
   - Go to **Developers** → **Webhooks**
   - Add endpoint: `https://your-domain.com/payments/webhook`
   - Select events: `checkout.session.completed`
   - Copy the webhook signing secret to your `.env`

## Troubleshooting

### "Stripe is not configured" error
- Make sure your `.env` file has `STRIPE_SECRET_KEY` set
- Restart your backend server after adding keys

### Payment modal doesn't open
- Check browser console for errors
- Make sure frontend dependencies are installed (`npm install`)

### Payment redirect doesn't work
- Check browser console for errors
- Verify the success_url and cancel_url in the payment modal
- Make sure backend is running and accessible

### CORS errors
- Make sure backend CORS is configured to allow your frontend origin
- Check that backend is running on the correct port

## Security Notes

- **Never commit your `.env` file** to git
- Use test keys for development
- Use live keys only in production
- Keep your secret keys secure and never expose them in frontend code

## Support

For Stripe-specific issues, check:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

