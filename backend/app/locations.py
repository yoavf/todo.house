"""Location management endpoints."""

import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from .database.engine import get_session
from .database.models import Location as LocationModel
from .models import Location, LocationCreate, LocationUpdate
from .dependencies import get_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locations", tags=["locations"])


@router.post("/", response_model=Location, status_code=201)
async def create_location(
    location: LocationCreate,
    user_id: uuid.UUID = Depends(get_user_id),
    session: AsyncSession = Depends(get_session),
):
    """Create a new location for the user."""
    db_location = LocationModel(
        user_id=user_id,
        **location.model_dump()
    )
    
    session.add(db_location)
    await session.commit()
    await session.refresh(db_location)
    
    logger.info(f"Created location {db_location.id} for user {user_id}")
    return Location.model_validate(db_location)


@router.get("/", response_model=List[Location])
async def list_locations(
    user_id: uuid.UUID = Depends(get_user_id),
    active_only: bool = True,
    session: AsyncSession = Depends(get_session),
):
    """List all locations for the user."""
    query = select(LocationModel).where(LocationModel.user_id == user_id)
    
    if active_only:
        query = query.where(LocationModel.is_active)
    
    query = query.order_by(LocationModel.name)
    
    result = await session.execute(query)
    locations = result.scalars().all()
    
    logger.info(f"Retrieved {len(locations)} locations for user {user_id}")
    return [Location.model_validate(loc) for loc in locations]


@router.get("/{location_id}", response_model=Location)
async def get_location(
    location_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    session: AsyncSession = Depends(get_session),
):
    """Get a specific location by ID."""
    query = select(LocationModel).where(
        and_(
            LocationModel.id == location_id,
            LocationModel.user_id == user_id
        )
    )
    
    result = await session.execute(query)
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    return Location.model_validate(location)


@router.patch("/{location_id}", response_model=Location)
async def update_location(
    location_id: uuid.UUID,
    location_update: LocationUpdate,
    user_id: uuid.UUID = Depends(get_user_id),
    session: AsyncSession = Depends(get_session),
):
    """Update an existing location."""
    query = select(LocationModel).where(
        and_(
            LocationModel.id == location_id,
            LocationModel.user_id == user_id
        )
    )
    
    result = await session.execute(query)
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Update only provided fields
    update_data = location_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    await session.commit()
    await session.refresh(location)
    
    logger.info(f"Updated location {location_id} for user {user_id}")
    return Location.model_validate(location)


@router.delete("/{location_id}", status_code=204)
async def delete_location(
    location_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    session: AsyncSession = Depends(get_session),
):
    """Delete a location (soft delete by setting is_active to False)."""
    query = select(LocationModel).where(
        and_(
            LocationModel.id == location_id,
            LocationModel.user_id == user_id
        )
    )
    
    result = await session.execute(query)
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Soft delete - just mark as inactive
    location.is_active = False
    await session.commit()
    
    logger.info(f"Deleted location {location_id} for user {user_id}")