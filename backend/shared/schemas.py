import math
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List

# =========================
# HELPER: HAVERSINE FORMULA
# =========================
def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates the great-circle distance between two points on the Earth surface."""
    R = 6371.0  # Earth radius in kilometers

    lat1_rad, lon1_rad = math.radians(lat1), math.radians(lon1)
    lat2_rad, lon2_rad = math.radians(lat2), math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

# =========================
# LOCATION SCHEMA
# =========================
class LocationSchema(BaseModel):
    id: str = Field(..., min_length=1, max_length=50, description="Unique location identifier")
    lat: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    lng: float = Field(..., ge=-180, le=180, description="Longitude coordinate")

# =========================
# OPTIMIZATION CONFIG
# =========================
class OptimizationConfigSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_closed_route: bool = Field(default=True, description="True if route must return to origin")

# =========================
# OPTIMIZATION REQUEST
# =========================
class OptimizationRequestSchema(BaseModel):
    locations: List[LocationSchema]
    config: OptimizationConfigSchema = Field(default_factory=OptimizationConfigSchema)

    @field_validator("locations")
    @classmethod
    def validate_locations(cls, value):
        # 1. Minimum and maximum locations
        if len(value) < 2:
            raise ValueError("At least 2 locations are required.")
        if len(value) > 15:
            raise ValueError("Maximum 15 locations allowed.")

        # 2. Prevent duplicate IDs
        ids = [location.id for location in value]
        if len(ids) != len(set(ids)):
            raise ValueError("Duplicate location IDs are not allowed.")

        # 3. 100km radius validation
        for i in range(len(value)):
            for j in range(i + 1, len(value)):
                distance = calculate_haversine_distance(
                    value[i].lat, value[i].lng, 
                    value[j].lat, value[j].lng
                )
                if distance > 100.0:
                    raise ValueError(
                        f"Locations '{value[i].id}' and '{value[j].id}' exceed the 100km limit "
                        f"({distance:.2f} km apart)."
                    )

        return value

# =========================
# ROUTE RESPONSE
# =========================
class RouteSchema(BaseModel):
    ordered_locations: List[str] = Field(..., min_length=2, description="Optimized route order")
    total_distance_km: float = Field(..., ge=0, description="Total route distance in kilometers")

# =========================
# FINAL RESPONSE
# =========================
class OptimizationResponseSchema(BaseModel):
    route: RouteSchema
    