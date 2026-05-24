from matrix_engine.distance_matrix import build_distance_matrix
from genetic_engine.genetic_algorithm import solve

from shared.schemas import (
    OptimizationRequestSchema,
    OptimizationResponseSchema,
    RouteSchema
)


def optimize_route(
    request: OptimizationRequestSchema
) -> OptimizationResponseSchema:

    coordinates = [
        (location.lat, location.lng)
        for location in request.locations
    ]

    distance_matrix = build_distance_matrix(
        coordinates
    )

    best_route = solve(distance_matrix)

    ordered_locations = [
        request.locations[i].id
        for i in best_route
    ]

    return OptimizationResponseSchema(
        route=RouteSchema(
            ordered_locations=ordered_locations,
            total_distance_km=0
        )
    )