# Backend Documentation

Backend service for the Route Optimizer platform.

The backend is responsible for:
- receiving optimization requests
- validating location data
- generating distance matrices
- executing the genetic algorithm
- returning optimized routes

---

# Backend Stack

| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python | Core backend language |
| Pydantic | Request/response validation |
| Google Maps API | Distance matrix generation |
| Genetic Algorithm | Route optimization |

---

# Backend Architecture

```text
Client Request
      ↓
FastAPI Endpoint
      ↓
Request Validation
      ↓
Distance Matrix Generation
      ↓
Genetic Algorithm
      ↓
Optimized Route Response
```

---

# Folder Structure

```text
backend/

├── api/
│   ├── __init__.py
│   └── routes.py
│
├── auth/
│   ├── __init__.py
│   └── firebase_auth.py
│
├── genetic_engine/
│   ├── __init__.py
│   └── genetic_algorithm.py
│
├── matrix_engine/
│   ├── __init__.py
│   └── distance_matrix.py
│
├── services/
│   ├── __init__.py
│   └── optimization_service.py
│
├── shared/
│   ├── __init__.py
│   └── schemas.py
│
├── main.py
└── README.md
```

---

# Core Modules

## api/

Handles HTTP communication with the frontend.

### Responsibilities
- API endpoints
- request routing
- response handling

---

## auth/

Handles Firebase authentication and token validation.

### Responsibilities
- JWT validation
- authentication middleware
- protected routes

---

## matrix_engine/

Responsible for generating and processing distance matrices.

### Responsibilities
- coordinate pair generation
- Google Maps API integration
- adjacency matrix creation
- distance calculations

---

## genetic_engine/

Contains the optimization algorithm implementation.

### Responsibilities
- population generation
- fitness evaluation
- crossover operations
- mutation operations
- route optimization loop

---

## services/

Acts as the orchestration layer between modules.

### Responsibilities
- connect matrix engine with optimizer
- coordinate backend workflow
- format optimization results

---

## shared/

Contains shared schemas and validation models.

### Responsibilities
- request validation
- response schemas
- shared data contracts

---

# API Endpoints

## Root Endpoint

```http
GET /
```

### Response

```json
{
  "status": "backend running"
}
```

---

## Optimization Endpoint

```http
POST /optimize
```

### Request Example

```json
{
  "locations": [
    {
      "id": "A",
      "lat": 19.4326,
      "lng": -99.1332
    },
    {
      "id": "B",
      "lat": 19.4978,
      "lng": -99.1269
    }
  ],
  "config": {
    "population_size": 100,
    "mutation_rate": 0.05,
    "generations": 500
  }
}
```

---

### Response Example

```json
{
  "best_route": {
    "ordered_locations": ["A", "B"],
    "total_distance_km": 12.4
  },
  "execution_time_seconds": 0.84
}
```

---

# Shared Schemas

The backend uses Pydantic schemas for:
- request validation
- automatic serialization
- API documentation generation

Main schemas:
- `LocationSchema`
- `OptimizationConfigSchema`
- `OptimizationRequestSchema`
- `RouteSchema`
- `OptimizationResponseSchema`

---

# Running the Backend

## Install dependencies

```bash
pip install fastapi uvicorn
```

---

## Start development server

From the backend directory:

```bash
python -m uvicorn main:app --reload
```

---

# Swagger Documentation

FastAPI automatically generates API documentation.

Available at:

```text
http://127.0.0.1:8000/docs
```

---

# Current Development Status

## Completed

- Backend modular architecture
- Shared API schemas
- FastAPI initialization
- Basic optimization endpoint

---

## In Progress

- Google Maps API integration
- Distance matrix generation
- Genetic algorithm implementation
- Firebase authentication

---

# Optimization Constraints

- Minimum locations: 2
- Maximum locations: 15
- Geographic coordinates required
- Duplicate location IDs are not allowed

---

# Future Improvements

- Route visualization support
- Caching layer for matrices
- Performance optimization
- Additional genetic operators
- Better optimization heuristics