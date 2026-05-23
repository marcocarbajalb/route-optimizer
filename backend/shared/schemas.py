from pydantic import BaseModel, Field, field_validator
from typing import List


# =========================
# LOCATION SCHEMA
# =========================

class LocationSchema(BaseModel):
    id: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Unique location identifier"
    )

    lat: float = Field(
        ...,
        ge=-90,
        le=90,
        description="Latitude coordinate"
    )

    lng: float = Field(
        ...,
        ge=-180,
        le=180,
        description="Longitude coordinate"
    )


# =========================
# OPTIMIZATION CONFIG
# =========================

class OptimizationConfigSchema(BaseModel):
    population_size: int = Field(
        default=100,
        gt=0,
        le=10000,
        description="Genetic algorithm population size"
    )

    mutation_rate: float = Field(
        default=0.05,
        ge=0,
        le=1,
        description="Mutation probability"
    )

    generations: int = Field(
        default=500,
        gt=0,
        le=100000,
        description="Maximum algorithm iterations"
    )


# =========================
# OPTIMIZATION REQUEST
# =========================

class OptimizationRequestSchema(BaseModel):
    locations: List[LocationSchema]

    config: OptimizationConfigSchema = Field(
        default_factory=OptimizationConfigSchema
    )

    @field_validator("locations")
    @classmethod
    def validate_locations(cls, value):

        # Minimum locations
        if len(value) < 2:
            raise ValueError(
                "At least 2 locations are required"
            )

        # Maximum locations
        if len(value) > 15:
            raise ValueError(
                "Maximum 15 locations allowed"
            )

        # Prevent duplicate IDs
        ids = [location.id for location in value]

        if len(ids) != len(set(ids)):
            raise ValueError(
                "Duplicate location IDs are not allowed"
            )

        return value


# =========================
# ROUTE RESPONSE
# =========================

class RouteSchema(BaseModel):
    ordered_locations: List[str] = Field(
        ...,
        min_length=2,
        description="Optimized route order"
    )

    total_distance_km: float = Field(
        ...,
        ge=0,
        description="Total route distance in kilometers"
    )


# =========================
# FINAL RESPONSE
# =========================

class OptimizationResponseSchema(BaseModel):
    best_route: RouteSchema

    execution_time_seconds: float = Field(
        ...,
        ge=0,
        description="Backend execution time"
    )