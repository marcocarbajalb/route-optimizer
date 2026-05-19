from pydantic import BaseModel, field_validator
from typing import List


class LocationSchema(BaseModel):
    id: str
    lat: float
    lng: float


class OptimizationConfigSchema(BaseModel):
    population_size: int = 100
    mutation_rate: float = 0.05
    generations: int = 500


class OptimizationRequestSchema(BaseModel):
    locations: List[LocationSchema]
    config: OptimizationConfigSchema

    @field_validator("locations")
    @classmethod
    def validate_locations(cls, value):
        if len(value) < 2:
            raise ValueError("Minimum 2 locations required")

        if len(value) > 15:
            raise ValueError("Maximum 15 locations allowed")

        return value


class RouteSchema(BaseModel):
    ordered_locations: List[str]
    total_distance_km: float


class OptimizationResponseSchema(BaseModel):
    best_route: RouteSchema
    execution_time_seconds: float