import random
from typing import List, Tuple

def calculate_route_distance(route: List[int], distance_matrix: List[List[float]], is_closed_route: bool) -> float:
    """Calculates the total physical distance of a given route sequence."""
    total_distance = 0.0
    
    for i in range(len(route) - 1):
        total_distance += distance_matrix[route[i]][route[i + 1]]
        
    # Add return trip to origin if the user requested a closed route
    if is_closed_route and len(route) > 1:
        total_distance += distance_matrix[route[-1]][route[0]]
        
    return total_distance

def order_crossover(parent1: List[int], parent2: List[int]) -> List[int]:
    """
    Performs Order Crossover (OX1) protecting the origin node (index 0).
    Ensures that no locations are duplicated or omitted in the child route.
    """
    size = len(parent1)
    
    # Protect origin by starting random selection from index 1
    start, end = sorted([random.randint(1, size - 1), random.randint(1, size - 1)])
    
    child = [-1] * size
    child[0] = parent1[0] # Keep the origin fixed
    
    # Copy a random sub-segment from parent1
    child[start:end + 1] = parent1[start:end + 1]
    
    # Fill the remaining positions with elements from parent2
    p2_idx = 1
    for i in range(1, size):
        if child[i] == -1:
            while parent2[p2_idx] in child:
                p2_idx += 1
            child[i] = parent2[p2_idx]
            
    return child

def mutate(route: List[int], mutation_rate: float) -> List[int]:
    """Applies Swap Mutation protecting the origin node."""
    mutated_route = route.copy()
    
    # Ensure we have at least 2 destinations to swap (excluding origin)
    if len(route) > 2 and random.random() < mutation_rate:
        idx1, idx2 = random.sample(range(1, len(route)), 2)
        mutated_route[idx1], mutated_route[idx2] = mutated_route[idx2], mutated_route[idx1]
        
    return mutated_route

def solve(
    distance_matrix: List[List[float]], 
    population_size: int, 
    generations: int, 
    mutation_rate: float, 
    is_closed_route: bool
) -> Tuple[List[int], float]:
    """Main Genetic Algorithm execution loop."""
    num_locations = len(distance_matrix)
    
    # Handle edge case for single location routes
    if num_locations <= 1:
        return list(range(num_locations)), 0.0
    
    # 1. Initialize random population (Keeping origin at index 0)
    base_route = list(range(1, num_locations))
    population = []
    for _ in range(population_size):
        individual = base_route.copy()
        random.shuffle(individual)
        population.append([0] + individual)
        
    best_overall_route = []
    best_overall_distance = float('inf')
    
    # 2. Evolution loop
    for _ in range(generations):
        # Sort population by fitness (shorter distance is better)
        population.sort(key=lambda r: calculate_route_distance(r, distance_matrix, is_closed_route))
        
        # Track the absolute best route found
        current_best_distance = calculate_route_distance(population[0], distance_matrix, is_closed_route)
        if current_best_distance < best_overall_distance:
            best_overall_distance = current_best_distance
            best_overall_route = population[0].copy()
            
        # Elitism: Dramatically reduced to prevent premature convergence (Top 2 individuals only)
        elite_count = 2
        next_generation = population[:elite_count]
        
        # 3. Crossover and Mutation
        while len(next_generation) < population_size:
            # Tournament Selection (k=3)
            parents = []
            for _ in range(2):
                tournament = random.sample(population, 3)
                tournament.sort(key=lambda r: calculate_route_distance(r, distance_matrix, is_closed_route))
                parents.append(tournament[0])
            
            child = order_crossover(parents[0], parents[1])
            child = mutate(child, mutation_rate)
            
            next_generation.append(child)
            
        population = next_generation
        
    return best_overall_route, best_overall_distance