import random


def calculate_route_distance(
    route: list[int],
    distance_matrix: list[list[float]]
) -> float:
    total_distance = 0.0

    for i in range(len(route) - 1):
        total_distance += distance_matrix[route[i]][route[i + 1]]

    total_distance += distance_matrix[route[-1]][route[0]]

    return total_distance


def generate_population(
    population_size: int,
    number_of_locations: int
) -> list[list[int]]:
    population = []

    base_route = list(range(number_of_locations))

    for _ in range(population_size):
        individual = base_route[:]
        random.shuffle(individual)
        population.append(individual)

    return population


def select_best(
    population: list[list[int]],
    distance_matrix: list[list[float]]
) -> list[int]:
    best_route = min(
        population,
        key=lambda route: calculate_route_distance(
            route,
            distance_matrix
        )
    )

    return best_route


def solve(
    distance_matrix: list[list[float]]
) -> list[int]:
    population_size = 100
    number_of_locations = len(distance_matrix)

    population = generate_population(
        population_size,
        number_of_locations
    )

    best_route = select_best(
        population,
        distance_matrix
    )

    return best_route