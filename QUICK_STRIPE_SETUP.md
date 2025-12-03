# Quick Stripe Setup Guide

Follow these steps to get Stripe payments working in your project.

## Step 1: Get Stripe API Keys (5 minutes)

1. **Sign up for Stripe** (if you don't have an account):
   - Go to https://stripe.com
   - Click "Start now" and create a free account

2. **Get your test API keys**:
   - Log in to https://dashboard.stripe.com
   - Make sure you're in **Test mode** (toggle in top right)
   - Go to **Developers** → **API keys**
   - Copy these two keys:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" to see it

## Step 2: Set Up Backend Environment (2 minutes)

1. **Navigate to backend folder**:
   ```bash
   cd backend
   ```

2. **Create `.env` file** (if it doesn't exist):
   ```bash
   # On Mac/Linux:
   touch .env
   
   # Or just open in your editor
   ```

3. **Add your keys to `.env`**:
   ```env
   SECRET_KEY=your-existing-jwt-secret-key
   STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
   ```

   **Important**: Replace `your_actual_secret_key_here` with the keys you copied from Stripe!

4. **Check if `.env` is in `.gitignore`** (to keep keys safe):
   ```bash
   cat .gitignore | grep .env
   ```
   If nothing shows, add `.env` to `.gitignore`:
   ```bash
   echo ".env" >> .gitignore
   ```

## Step 3: Install Dependencies (2 minutes)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

## Step 4: Start Your Servers

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```
You should see: `Uvicorn running on http://127.0.0.1:8000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
You should see: `Local: http://localhost:5173` (or similar)

## Step 5: Test It! (1 minute)

1. Open http://localhost:5173 in your browser
2. Click the green donation button
3. Enter:
   - Amount: `25` (or any amount)
   - Email: `test@example.com`
4. Click "Donate $25.00"
5. You'll be redirected to Stripe Checkout
6. Use Stripe's test card:
   - **Card number**: `4242 4242 4242 4242`
   - **Expiry**: Any future date (e.g., `12/34`)
   - **CVC**: Any 3 digits (e.g., `123`)
   - **ZIP**: Any 5 digits (e.g., `12345`)
7. Click "Pay"
8. You should be redirected back to your home page!

## Troubleshooting

### Error: "Stripe is not configured"
- ✅ Check that `.env` file exists in `backend/` folder
- ✅ Check that `STRIPE_SECRET_KEY` is set in `.env`
- ✅ Restart your backend server after adding keys

### Error: "Failed to create checkout session"
- ✅ Make sure backend is running on port 8000
- ✅ Check backend terminal for error messages
- ✅ Verify your Stripe secret key is correct (starts with `sk_test_`)

### Payment modal doesn't open
- ✅ Check browser console (F12) for errors
- ✅ Make sure frontend dependencies are installed: `npm install`

### CORS errors
- ✅ Backend CORS is already configured to allow all origins
- ✅ Make sure backend is running

## Test Cards

Stripe provides test cards for different scenarios:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Declined payment |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |

## Next Steps

Once everything works:
1. Test with different amounts
2. Test the cancel flow (click cancel on Stripe checkout)
3. Check your Stripe Dashboard → Payments to see test payments
4. When ready for production, switch to live keys in Stripe Dashboard

## Need Help?

- Check the full guide: `STRIPE_SETUP.md`
- Stripe Docs: https://stripe.com/docs
- Backend API docs: http://localhost:8000/docs (when backend is running)

