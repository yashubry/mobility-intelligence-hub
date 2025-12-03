from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
import stripe
from app.config import settings

router = APIRouter(prefix="/payments", tags=["payments"])

# Initialize Stripe - will be set in each endpoint to ensure it's current


class CreateCheckoutSessionRequest(BaseModel):
    amount: int  # Amount in cents
    currency: str = "usd"
    success_url: str
    cancel_url: str
    description: Optional[str] = "Donation to CareerRise"
    name: Optional[str] = None
    email: Optional[str] = None


class CreatePaymentIntentRequest(BaseModel):
    amount: int  # Amount in cents
    currency: str = "usd"
    description: Optional[str] = "Donation to CareerRise"
    name: Optional[str] = None
    email: Optional[str] = None


@router.post("/create-checkout-session")
async def create_checkout_session(request: CreateCheckoutSessionRequest):
    """
    Create a Stripe Checkout Session for donations
    """
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
        )
    
    # Set Stripe API key
    stripe.api_key = settings.stripe_secret_key
    
    try:
        # Build customer email if provided
        customer_email = request.email if request.email else None
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": request.currency,
                        "product_data": {
                            "name": "CareerRise Donation",
                            "description": request.description,
                        },
                        "unit_amount": request.amount,
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=request.success_url,
            cancel_url=request.cancel_url,
            customer_email=customer_email,
            metadata={
                "donation": "true",
                "organization": "CareerRise",
                "donor_name": request.name or "Anonymous",
            }
        )
        
        return {
            "sessionId": checkout_session.id,
            "url": checkout_session.url
        }
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating checkout session: {str(e)}"
        )


@router.post("/create-payment-intent")
async def create_payment_intent(request: CreatePaymentIntentRequest):
    """
    Create a Stripe Payment Intent for embedded payment form
    """
    if not settings.stripe_secret_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables."
        )
    
    # Ensure Stripe API key is set
    stripe.api_key = settings.stripe_secret_key
    
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=request.amount,
            currency=request.currency,
            description=request.description,
            metadata={
                "donation": "true",
                "organization": "CareerRise",
                "donor_name": request.name or "Anonymous",
                "donor_email": request.email or "",
            }
        )
        
        return {
            "clientSecret": payment_intent.client_secret
        }
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error creating payment intent: {str(e)}"
        )


@router.get("/config")
async def get_stripe_config():
    """
    Get Stripe publishable key for frontend
    """
    if not settings.stripe_publishable_key:
        raise HTTPException(
            status_code=500,
            detail="Stripe publishable key is not configured."
        )
    
    return {
        "publishableKey": settings.stripe_publishable_key
    }


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Handle Stripe webhook events
    """
    if not settings.stripe_webhook_secret:
        raise HTTPException(
            status_code=500,
            detail="Stripe webhook secret is not configured."
        )
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Handle successful payment
        # You can save donation records to database here
        print(f"Payment successful: {session.id}")
        print(f"Amount: ${session.amount_total / 100}")
        print(f"Customer: {session.customer_email}")
    
    return JSONResponse(status_code=200, content={"status": "success"})

