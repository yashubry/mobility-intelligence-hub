"""
KPI Monitoring Service
Checks KPI values against user-defined thresholds and triggers email notifications
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.models import ThresholdOperator
from app.services.email_service import email_service
from app.database import database
import logging

logger = logging.getLogger(__name__)


class KPIMonitor:
    """
    Service for monitoring KPIs and sending notifications when thresholds are triggered.
    
    Note: This service assumes database collections will be created by your teammate.
    For now, it's structured to work with:
    - kpi_metrics collection (for KPI data)
    - notification_preferences collection (for user preferences)
    - notification_history collection (for logging sent emails)
    """
    
    def __init__(self):
        """Initialize the KPI monitor with database collections."""
        # These collections will be created by your teammate
        # For now, we're just setting up the structure
        self.kpi_metrics_collection = database.get_collection("kpi_metrics")
        self.notification_preferences_collection = database.get_collection("notification_preferences")
        self.notification_history_collection = database.get_collection("notification_history")
    
    def _check_threshold(
        self,
        current_value: float,
        threshold_value: float,
        operator: ThresholdOperator
    ) -> bool:
        """
        Check if current value meets the threshold condition.
        
        Args:
            current_value: Current KPI value
            threshold_value: Threshold to compare against
            operator: Comparison operator (less_than, greater_than, etc.)
        
        Returns:
            True if threshold condition is met, False otherwise
        """
        if operator == ThresholdOperator.LESS_THAN:
            return current_value < threshold_value
        elif operator == ThresholdOperator.LESS_THAN_OR_EQUAL:
            return current_value <= threshold_value
        elif operator == ThresholdOperator.GREATER_THAN:
            return current_value > threshold_value
        elif operator == ThresholdOperator.GREATER_THAN_OR_EQUAL:
            return current_value >= threshold_value
        elif operator == ThresholdOperator.EQUAL:
            return current_value == threshold_value
        return False
    
    async def check_kpi_thresholds(
        self,
        kpi_id: str,
        current_value: float,
        kpi_name: str = None
    ) -> List[Dict]:
        """
        Check if current KPI value triggers any notification thresholds.
        Sends emails to users whose thresholds are met.
        
        Args:
            kpi_id: ID of the KPI being checked
            current_value: Current value of the KPI
            kpi_name: Optional name of the KPI (if not provided, will try to fetch)
        
        Returns:
            List of dictionaries with notification results
        """
        triggered_notifications = []
        
        try:
            # Get KPI name if not provided
            if kpi_name is None:
                kpi = await self.kpi_metrics_collection.find_one({"kpi_id": kpi_id})
                kpi_name = kpi.get("name", kpi_id) if kpi else kpi_id
            
            # Get all enabled notification preferences for this KPI
            preferences = await self.notification_preferences_collection.find({
                "kpi_id": kpi_id,
                "enabled": True
            }).to_list(length=None)
            
            for pref in preferences:
                # Check cooldown period
                if pref.get("last_notified"):
                    last_notified = pref["last_notified"]
                    if isinstance(last_notified, str):
                        last_notified = datetime.fromisoformat(last_notified.replace('Z', '+00:00'))
                    elif isinstance(last_notified, datetime):
                        pass  # Already a datetime
                    else:
                        continue
                    
                    cooldown_end = last_notified + timedelta(hours=pref.get("cooldown_hours", 24))
                    if datetime.utcnow() < cooldown_end:
                        logger.debug(f"Skipping notification for user {pref.get('user_id')} - still in cooldown")
                        continue  # Still in cooldown period
                
                # Get threshold operator
                operator_str = pref.get("threshold_operator", "less_than")
                try:
                    operator = ThresholdOperator(operator_str)
                except ValueError:
                    logger.warning(f"Invalid threshold operator: {operator_str}, defaulting to less_than")
                    operator = ThresholdOperator.LESS_THAN
                
                # Check if threshold is triggered
                is_triggered = self._check_threshold(
                    current_value,
                    pref["threshold_value"],
                    operator
                )
                
                if is_triggered:
                    # Send notification email
                    email = pref.get("email")
                    date_range = pref.get("date_range", datetime.now().strftime("%B %Y"))
                    alert_frequency = pref.get("alert_frequency", "daily")
                    
                    success = await email_service.send_kpi_alert(
                        to_email=email,
                        kpi_name=kpi_name,
                        current_value=current_value,
                        threshold_value=pref["threshold_value"],
                        date_range=date_range,
                        alert_frequency=alert_frequency
                    )
                    
                    if success:
                        # Update last_notified timestamp
                        await self.notification_preferences_collection.update_one(
                            {"_id": pref["_id"]},
                            {"$set": {"last_notified": datetime.utcnow()}}
                        )
                        
                        # Log notification history
                        notification_history = {
                            "user_id": pref.get("user_id"),
                            "kpi_id": kpi_id,
                            "kpi_name": kpi_name,
                            "threshold_value": pref["threshold_value"],
                            "actual_value": current_value,
                            "sent_at": datetime.utcnow(),
                            "email": email
                        }
                        
                        await self.notification_history_collection.insert_one(notification_history)
                        
                        triggered_notifications.append({
                            "user_id": pref.get("user_id"),
                            "email": email,
                            "kpi_id": kpi_id,
                            "kpi_name": kpi_name,
                            "success": True
                        })
                    else:
                        triggered_notifications.append({
                            "user_id": pref.get("user_id"),
                            "email": email,
                            "kpi_id": kpi_id,
                            "kpi_name": kpi_name,
                            "success": False,
                            "error": "Failed to send email"
                        })
        
        except Exception as e:
            logger.error(f"Error checking KPI thresholds for {kpi_id}: {str(e)}")
        
        return triggered_notifications
    
    async def update_kpi_value(
        self,
        kpi_id: str,
        value: float,
        kpi_name: str = None,
        date_range: str = None
    ) -> Dict:
        """
        Update a KPI value and check for triggered notifications.
        
        This is the main function to call when a KPI value is updated.
        It will:
        1. Update the KPI value in the database
        2. Check all notification preferences
        3. Send emails if thresholds are met
        
        Args:
            kpi_id: ID of the KPI
            value: New value for the KPI
            kpi_name: Optional name of the KPI
            date_range: Optional date range string
        
        Returns:
            Dictionary with update results and notification status
        """
        try:
            # Update KPI metric in database
            update_data = {
                "current_value": value,
                "last_updated": datetime.utcnow()
            }
            if date_range:
                update_data["date_range"] = date_range
            
            await self.kpi_metrics_collection.update_one(
                {"kpi_id": kpi_id},
                {"$set": update_data},
                upsert=True  # Create if doesn't exist
            )
            
            # Check thresholds and send notifications
            triggered = await self.check_kpi_thresholds(kpi_id, value, kpi_name)
            
            return {
                "success": True,
                "kpi_id": kpi_id,
                "value": value,
                "notifications_triggered": len(triggered),
                "triggered": triggered
            }
        
        except Exception as e:
            logger.error(f"Error updating KPI value for {kpi_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Create a singleton instance
kpi_monitor = KPIMonitor()

