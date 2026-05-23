from matrix_engine.distance_matrix import build_distance_matrix
from genetic_engine.genetic_algorithm import solve


def optimize_routes(request):
    distance_matrix = build_distance_matrix(request.locations)

    best_route = solve(distance_matrix)

    return {
        "route": best_route
    }