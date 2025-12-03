"""
KPI Routes
API endpoints for managing KPIs and updating their values
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from app.models import (
    KPIMetricCreate,
    KPIMetricResponse,
    KPIUpdateRequest
)
from app.database import database
from app.dependencies import get_current_user
from app.services.kpi_monitor import kpi_monitor
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kpis", tags=["KPIs"])

# Get database collection
# Note: This will be created by your teammate
kpi_metrics_collection = database.get_collection("kpi_metrics")


@router.post("/", response_model=KPIMetricResponse, status_code=status.HTTP_201_CREATED)
async def create_kpi(
    kpi: KPIMetricCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new KPI metric definition.
    
    This creates the KPI in the system. The actual value can be updated later.
    """
    try:
        # Check if KPI already exists
        existing = await kpi_metrics_collection.find_one({"kpi_id": kpi.kpi_id})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"KPI with id '{kpi.kpi_id}' already exists"
            )
        
        # Create KPI document
        kpi_doc = {
            "kpi_id": kpi.kpi_id,
            "name": kpi.name,
            "description": kpi.description,
            "unit": kpi.unit,
            "current_value": kpi.current_value,
            "last_updated": datetime.utcnow() if kpi.current_value is not None else None,
            "created_at": datetime.utcnow()
        }
        
        result = await kpi_metrics_collection.insert_one(kpi_doc)
        
        return KPIMetricResponse(
            kpi_id=kpi.kpi_id,
            name=kpi.name,
            description=kpi.description,
            unit=kpi.unit,
            current_value=kpi.current_value,
            last_updated=kpi_doc["last_updated"]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating KPI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create KPI: {str(e)}"
        )


@router.get("/", response_model=List[KPIMetricResponse])
async def get_all_kpis(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all available KPIs.
    
    Returns a list of all KPIs in the system with their current values.
    """
    try:
        kpis = await kpi_metrics_collection.find({}).to_list(length=None)
        
        return [
            KPIMetricResponse(
                kpi_id=kpi["kpi_id"],
                name=kpi["name"],
                description=kpi.get("description"),
                unit=kpi.get("unit"),
                current_value=kpi.get("current_value"),
                last_updated=kpi.get("last_updated")
            )
            for kpi in kpis
        ]
    
    except Exception as e:
        logger.error(f"Error fetching KPIs: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch KPIs: {str(e)}"
        )


@router.get("/{kpi_id}", response_model=KPIMetricResponse)
async def get_kpi(
    kpi_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific KPI by its ID.
    """
    try:
        kpi = await kpi_metrics_collection.find_one({"kpi_id": kpi_id})
        
        if not kpi:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"KPI with id '{kpi_id}' not found"
            )
        
        return KPIMetricResponse(
            kpi_id=kpi["kpi_id"],
            name=kpi["name"],
            description=kpi.get("description"),
            unit=kpi.get("unit"),
            current_value=kpi.get("current_value"),
            last_updated=kpi.get("last_updated")
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching KPI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch KPI: {str(e)}"
        )


@router.post("/{kpi_id}/update", status_code=status.HTTP_200_OK)
async def update_kpi_value(
    kpi_id: str,
    update_request: KPIUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a KPI value and trigger notification checks.
    
    This is the main endpoint to call when a KPI value changes.
    It will:
    1. Update the KPI value in the database
    2. Check all user notification preferences for this KPI
    3. Send emails if thresholds are met
    
    Returns information about which notifications were triggered.
    """
    try:
        # Get KPI name for better email content
        kpi = await kpi_metrics_collection.find_one({"kpi_id": kpi_id})
        kpi_name = kpi.get("name", kpi_id) if kpi else kpi_id
        
        # Update KPI value and check thresholds
        result = await kpi_monitor.update_kpi_value(
            kpi_id=kpi_id,
            value=update_request.value,
            kpi_name=kpi_name,
            date_range=update_request.date_range
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to update KPI")
            )
        
        return {
            "message": "KPI updated successfully",
            "kpi_id": kpi_id,
            "kpi_name": kpi_name,
            "value": update_request.value,
            "notifications_triggered": result["notifications_triggered"],
            "triggered_notifications": result["triggered"]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating KPI value: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update KPI: {str(e)}"
        )

