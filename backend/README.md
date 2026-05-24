# Backend Documentation

Backend service for the Route Optimizer platform.

The backend is responsible for:
- receiving optimization requests
- validating location data
- generating distance matrices
- executing the optimization workflow
- returning optimized routes

---

# Backend Stack

| Technology | Purpose |
|---|---|
| FastAPI | REST API framework |
| Python | Core backend language |
| Pydantic | Request/response validation |
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
Optimization Service
      ↓
Distance Matrix Generation
      ↓
Genetic Algorithm
      ↓
Optimized Route Response
```

---

# Layered Architecture

```text
API Layer
    ↓
Service Layer
    ↓
Matrix Engine
    ↓
Optimization Engine
```

---

# Optimization Workflow

1. The client sends a route optimization request.
2. The API validates the request body using Pydantic schemas.
3. The optimization service coordinates the optimization pipeline.
4. The matrix engine generates a distance matrix from input coordinates.
5. The genetic algorithm evaluates candidate routes.
6. The best route is returned as the optimization result.

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
- Euclidean distance calculation
- adjacency matrix generation
- pairwise distance computation
- route cost preparation

---

## genetic_engine/

Contains the optimization algorithm implementation.

### Responsibilities
- population generation
- route distance evaluation
- candidate route selection
- optimization workflow

---

## services/

Acts as the orchestration layer between modules.

### Responsibilities
- connect matrix engine with optimizer
- coordinate backend workflow
- format optimization results
- manage optimization pipeline

---

## shared/

Contains shared schemas and validation models.

### Responsibilities
- request validation
- response schemas
- shared data contracts

---

# Current Optimization Flow

The current implementation follows this execution flow:

```text
Request
   ↓
optimization_service.py
   ↓
distance_matrix.py
   ↓
genetic_algorithm.py
   ↓
Response
```

---

# Genetic Algorithm Overview

The current optimization engine includes:

- random route population generation
- Euclidean route distance calculation
- candidate route evaluation
- best route selection

Planned additions:
- crossover operators
- mutation operators
- generation evolution loop
- elitism strategies
- configurable optimization parameters

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
      "lat": 14.6349,
      "lng": -90.5069
    },
    {
      "id": "B",
      "lat": 14.6248,
      "lng": -90.5328
    },
    {
      "id": "C",
      "lat": 14.6111,
      "lng": -90.5133
    }
  ]
}
```

---

### Response Example

```json
{
  "route": {
    "ordered_locations": [
      "C",
      "A",
      "B"
    ],
    "total_distance_km": 0
  }
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
- `OptimizationRequestSchema`
- `OptimizationResponseSchema`
- `RouteSchema`

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
- Optimization workflow service
- Euclidean distance matrix generation
- Initial route optimization workflow integration
- Initial genetic search implementation

---

## In Progress

- Full genetic evolution cycle
- Mutation and crossover operators
- Firebase authentication
- Real-world map integrations

---

# Optimization Constraints

- Minimum locations: 2
- Maximum locations per request: 15
- Geographic coordinates required
- Duplicate location IDs are not allowed
- Routes are currently optimized using Euclidean distance

---

# Future Improvements

- Google Maps API integration
- Route visualization support
- Multi-vehicle optimization
- Traffic-aware routing
- Performance optimization
- Advanced genetic operators
- Better optimization heuristics