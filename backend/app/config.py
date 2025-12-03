from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # SendGrid Email Configuration
    sendgrid_api_key: Optional[str] = None
    sendgrid_from_email: str = "noreply@careerrise.org"
    sendgrid_from_name: str = "CareerRise"
    dashboard_url: str = "https://dashboard.careerrise.org"  # Update with your actual dashboard URL
    
    # Stripe Configuration
    stripe_secret_key: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_webhook_secret: Optional[str] = None

    class Config:
        env_file = ".env"


settings = Settings()
