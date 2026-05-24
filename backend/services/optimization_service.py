from matrix_engine.distance_matrix import build_distance_matrix
from genetic_engine.genetic_algorithm import solve

from shared.schemas import (
    OptimizationRequestSchema,
    OptimizationResponseSchema,
    RouteSchema
)

def optimize_route(request: OptimizationRequestSchema) -> OptimizationResponseSchema:

    coordinates = [
        (location.lat, location.lng)
        for location in request.locations
    ]

    # Build the real distance matrix from Google Maps API
    distance_matrix = build_distance_matrix(coordinates)

    # Run the genetic algorithm
    best_route_indices, total_distance = solve(
        distance_matrix=distance_matrix,
        population_size=request.config.population_size,
        generations=request.config.generations,
        mutation_rate=request.config.mutation_rate,
        is_closed_route=request.config.is_closed_route
    )

    # Map the resulting indices back to the original location IDs
    ordered_locations = [
        request.locations[i].id
        for i in best_route_indices
    ]

    return OptimizationResponseSchema(
        route=RouteSchema(
            ordered_locations=ordered_locations,
            total_distance_km=round(total_distance, 2)
        )
    )