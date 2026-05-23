import math


def euclidean_distance(
    point_a: tuple[float, float],
    point_b: tuple[float, float]
) -> float:
    x1, y1 = point_a
    x2, y2 = point_b

    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def build_distance_matrix(
    locations: list[tuple[float, float]]
) -> list[list[float]]:
    size = len(locations)

    matrix: list[list[float]] = [
        [0.0 for _ in range(size)]
        for _ in range(size)
    ]

    for i in range(size):
        for j in range(size):
            if i != j:
                matrix[i][j] = euclidean_distance(
                    locations[i],
                    locations[j]
                )

    return matrix