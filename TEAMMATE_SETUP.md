# Quick Setup for Teammates

## To See the Full 4-Step Checkout Functionality:

### 1. Make sure you're on the donation branch:
```bash
git checkout donation
git pull origin donation
```

### 2. Install ALL dependencies:

**Frontend:**
```bash
cd frontend
npm install
```

This will install:
- @stripe/react-stripe-js
- @stripe/stripe-js  
- canvas-confetti
- All other dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

This will install:
- stripe (latest version)
- fastapi
- All other dependencies

### 3. Set up Stripe keys in `backend/.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

**Note:** Get your Stripe test keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)

### 4. Start both servers:

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Test the 4-step checkout:

1. Open http://localhost:5173
2. Click the green donation button
3. You should see:
   - **Step 1:** Amount selection (preset buttons + custom input)
   - **Step 2:** Donor information (name + email)
   - **Step 3:** Payment (card input + billing address)
   - **Step 4:** Success screen with confetti!

## Troubleshooting:

**If you don't see the 4-step checkout:**
- ✅ Make sure you ran `npm install` in frontend
- ✅ Make sure you're on the `donation` branch
- ✅ Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- ✅ Check browser console for errors (F12)

**If payment form doesn't show:**
- ✅ Make sure backend is running on port 8000
- ✅ Check that Stripe keys are in `backend/.env`
- ✅ Restart backend after adding keys

**If you see errors:**
- Check that all npm packages are installed: `npm list @stripe/react-stripe-js @stripe/stripe-js canvas-confetti`
- Check that Stripe is installed in backend: `pip list | grep stripe`

## What You Should See:

The checkout has **4 distinct steps** with step indicators at the top:
1. **Amount** - Select donation amount
2. **Information** - Enter name and email  
3. **Payment** - Enter card details and billing address
4. **Success** - Confirmation with confetti celebration

Each step has a "Continue" or "Back" button to navigate between steps.
