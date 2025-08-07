"""Location management endpoints."""

import logging
import uuid
from typing import List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_session_dependency, User as UserModel
from .database.models import Location as LocationModel
from .models import Location, LocationCreate, LocationUpdate
from .config import app_config
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locations", tags=["locations"])


def get_user_id(current_user: UserModel = Depends(get_current_user)) -> uuid.UUID:
    """Get the user's UUID from the authenticated user."""
    return current_user.id


@router.post("/", response_model=Location, status_code=201)
async def create_location(
    location: LocationCreate,
    user_id: uuid.UUID = Depends(get_user_id),
    session: AsyncSession = Depends(get_session_dependency),
):
    """Create a new location for the user."""
    location_data = location.model_dump()

    # Check if this is a default location
    if location.name in app_config.default_locations:
        location_data["is_default"] = True

    db_location = LocationModel(user_id=user_id, **location_data)

    session.add(db_location)
    await session.commit()
    await session.refresh(db_location)

    logger.info(f"Created location {db_location.id} for user {user_id}")
    return Location.model_validate(db_location)


@router.get("/", response_model=List[Location])
async def list_locations(
    user_id: uuid.UUID = Depends(get_user_id),
    active_only: bool = True,
    session: AsyncSession = Depends(get_session_dependency),
):
    """List all locations for the user, including defaults not yet saved."""
    query = select(LocationModel).where(LocationModel.user_id == user_id)

    if active_only:
        query = query.where(LocationModel.is_active)

    result = await session.execute(query)
    db_locations = result.scalars().all()

    # Convert to Location models
    locations = []
    saved_location_names = set()

    # First add all user's saved locations (custom ones first, then used defaults)
    for db_loc in sorted(db_locations, key=lambda x: (x.is_default, x.name)):
        loc = Location.model_validate(db_loc)
        loc.is_from_defaults = db_loc.is_default
        locations.append(loc)
        saved_location_names.add(db_loc.name)

    # Then add any default locations that haven't been used yet
    for default_name in app_config.default_locations:
        if default_name not in saved_location_names:
            # Create a virtual location for display
            virtual_location = Location(
                id=uuid.uuid4(),  # Temporary ID for frontend
                user_id=user_id,
                name=default_name,
                description=None,
                is_active=True,
                is_default=True,
                is_from_defaults=True,
                location_metadata=None,
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            locations.append(virtual_location)

    logger.info(
        f"Retrieved {len(locations)} locations for user {user_id} ({len(db_locations)} saved, {len(locations) - len(db_locations)} defaults)"
    )
    return locations


@router.get("/{location_id}", response_model=Location)
async def get_location(
    location_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_user_id),
    session: AsyncSession = Depends(get_session_dependency),
):
    """Get a specific location by ID."""
    query = select(LocationModel).where(
        and_(LocationModel.id == location_id, LocationModel.user_id == user_id)
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
    session: AsyncSession = Depends(get_session_dependency),
):
    """Update an existing location."""
    query = select(LocationModel).where(
        and_(LocationModel.id == location_id, LocationModel.user_id == user_id)
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
    session: AsyncSession = Depends(get_session_dependency),
):
    """Delete a location (soft delete by setting is_active to False)."""
    query = select(LocationModel).where(
        and_(LocationModel.id == location_id, LocationModel.user_id == user_id)
    )

    result = await session.execute(query)
    location = result.scalar_one_or_none()

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    # Soft delete - just mark as inactive
    location.is_active = False
    await session.commit()

    logger.info(f"Deleted location {location_id} for user {user_id}")
    return
