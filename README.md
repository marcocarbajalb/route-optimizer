# Route Optimizer

> Developed by Marco Carbajal (23025), Carlos Aldana (23394), Diego Monroy (23394), and Carlos Angel (23010)

Route Optimizer is a web platform that calculates optimized routes between multiple geographic locations using a modular backend architecture and a genetic algorithm approach to solve the Traveling Salesman Problem (TSP).

The system is designed for small-scale route optimization scenarios with a minimum of 2 and a maximum of 15 locations.

---

# Features

- Route optimization using Genetic Algorithms
- Euclidean distance matrix generation
- Interactive frontend built with React
- Backend API built with FastAPI
- Firebase Authentication
- Request and response validation using Pydantic
- Modular optimization architecture
- Structured optimization workflow

---

# Project Architecture

```text
Frontend (React)
        ↓
Firebase Authentication
        ↓
FastAPI Backend
        ↓
Optimization Service
        ↓
Distance Matrix Engine
        ↓
Genetic Algorithm Optimizer
        ↓
Optimized Route Response
```

---

# Technologies

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI |
| Optimization | Genetic Algorithm |
| Distance Engine | Euclidean Distance Matrix |
| Authentication | Firebase Auth |
| Validation | Pydantic |
| Language | Python + JavaScript |

---

# Project Structure

```text
route-optimizer/

├── backend/
│   ├── api/
│   ├── auth/
│   ├── genetic_engine/
│   ├── matrix_engine/
│   ├── services/
│   ├── shared/
│   ├── main.py
│   └── README.md
│
├── frontend/
│   ├── src/
│   └── README.md
│
├── diagrams/
│   ├── architecture.drawio
│   └── flow.drawio
│
├── .gitignore
└── README.md
```

---

# Modules Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

---

# Current Development Status

## Completed

- Initial project architecture
- Backend modular structure
- Shared API schemas
- FastAPI initialization
- Optimization workflow integration
- Distance matrix generation
- Optimization service orchestration
- Initial genetic search implementation
- Structured request and response schemas
- Project diagrams

---

## In Progress

- Full genetic evolution cycle
- Mutation and crossover operators
- Google Maps API integration
- Frontend optimization interface
- Firebase authentication integration
- Real-world route visualization

---

# Optimization Flow

```text
User Input
    ↓
Frontend Request
    ↓
FastAPI Endpoint
    ↓
Request Validation
    ↓
Optimization Service
    ↓
Distance Matrix Generation
    ↓
Genetic Algorithm Execution
    ↓
Optimized Route Response
```

---

# Current Optimization Status

The current optimization engine includes:

- random route population generation
- Euclidean distance evaluation
- candidate route selection
- best-route optimization

Planned improvements:

- crossover operators
- mutation operators
- multi-generation evolution
- elitism strategies
- configurable optimization parameters
- advanced optimization heuristics

---

# Optimization Constraints

- Minimum locations: 2
- Maximum locations: 15
- Geographic coordinates are required
- Duplicate location IDs are not allowed
- Routes are currently optimized using Euclidean distance

---

# API Overview

The backend currently exposes:

## Root Endpoint

```http
GET /
```

Returns backend status information.

---

## Optimization Endpoint

```http
POST /optimize
```

Executes the optimization workflow and returns an optimized route response.

---

# Running the Project

## Backend

Navigate to the backend folder:

```bash
cd backend
```

Run the FastAPI server:

```bash
python -m uvicorn main:app --reload
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend

Navigate to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

---

# Contributors

| Name | ID |
|---|---|
| Marco Carbajal | 23025 |
| Carlos Aldana | 23394 |
| Diego Monroy | 23394 |
| Carlos Angel | 23010 |

---

# License

Academic project developed for educational purposes.