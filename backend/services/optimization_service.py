from matrix_engine.distance_matrix import build_distance_matrix
from genetic_engine.genetic_algorithm import solve

from shared.schemas import (
    OptimizationRequestSchema,
    OptimizationResponseSchema,
    RouteSchema
)

# Genetic algorithm hyperparameters — fixed on the backend.
GA_POPULATION_SIZE = 100
GA_GENERATIONS = 500
GA_MUTATION_RATE = 0.05


def optimize_route(request: OptimizationRequestSchema) -> OptimizationResponseSchema:

    coordinates = [
        (location.lat, location.lng)
        for location in request.locations
    ]

    # Build the real distance matrix from Google Maps API
    distance_matrix = build_distance_matrix(coordinates)

    # Run the genetic algorithm with the fixed backend hyperparameters.
    best_route_indices, total_distance = solve(
        distance_matrix=distance_matrix,
        population_size=GA_POPULATION_SIZE,
        generations=GA_GENERATIONS,
        mutation_rate=GA_MUTATION_RATE,
        is_closed_route=request.config.is_closed_route
    )

    # Map the resulting indices back to the original location IDs
    ordered_locations = [
        request.locations[i].id
        for i in best_route_indices
    ]

    # Explicitly append the origin to the end of the list if it's a closed route
    if request.config.is_closed_route and len(ordered_locations) > 1:
        ordered_locations.append(ordered_locations[0])

    return OptimizationResponseSchema(
        route=RouteSchema(
            ordered_locations=ordered_locations,
            total_distance_km=round(total_distance, 2)
        )
    )