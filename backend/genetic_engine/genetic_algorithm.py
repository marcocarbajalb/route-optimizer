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
    Performs Order Crossover (OX1) for permutation-based chromosomes.
    Ensures that no locations are duplicated or omitted in the child route.
    """
    size = len(parent1)
    start, end = sorted([random.randint(0, size - 1), random.randint(0, size - 1)])
    
    child = [-1] * size
    
    # Copy a random sub-segment from parent1
    child[start:end + 1] = parent1[start:end + 1]
    
    # Fill the remaining positions with elements from parent2, preserving their relative order
    p2_idx = 0
    for i in range(size):
        if child[i] == -1:
            while parent2[p2_idx] in child:
                p2_idx += 1
            child[i] = parent2[p2_idx]
            
    return child

def mutate(route: List[int], mutation_rate: float) -> List[int]:
    """Applies Swap Mutation by randomly swapping two locations in the route."""
    mutated_route = route.copy()
    if random.random() < mutation_rate:
        idx1, idx2 = random.sample(range(len(route)), 2)
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
    
    # 1. Initialize random population
    base_route = list(range(num_locations))
    population = []
    for _ in range(population_size):
        individual = base_route.copy()
        random.shuffle(individual)
        population.append(individual)
        
    best_overall_route = []
    best_overall_distance = float('inf')
    
    # 2. Evolution loop
    for generation in range(generations):
        # Sort population by fitness (shorter distance is better)
        population.sort(key=lambda r: calculate_route_distance(r, distance_matrix, is_closed_route))
        
        # Track the absolute best route found
        current_best_distance = calculate_route_distance(population[0], distance_matrix, is_closed_route)
        if current_best_distance < best_overall_distance:
            best_overall_distance = current_best_distance
            best_overall_route = population[0].copy()
            
        # Elitism: carry over the top 20% of the population directly to the next generation
        elite_count = max(2, int(population_size * 0.2))
        next_generation = population[:elite_count]
        
        # 3. Crossover and Mutation to fill the rest of the generation
        while len(next_generation) < population_size:
            # Select parents from the better half of the population (Tournament-style bias)
            parent1 = random.choice(population[:int(population_size * 0.5)])
            parent2 = random.choice(population[:int(population_size * 0.5)])
            
            child = order_crossover(parent1, parent2)
            child = mutate(child, mutation_rate)
            
            next_generation.append(child)
            
        population = next_generation
        
    return best_overall_route, best_overall_distance
    