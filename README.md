# Route Optimizer

> Developed by Marco Carbajal (23025), Carlos Aldana (23394), Diego Monroy (23394), and Carlos Angel (23010)

Route Optimizer is a web platform that calculates the shortest possible route between multiple geographic locations using Google Maps APIs and a genetic algorithm approach to solve the Traveling Salesman Problem (TSP).

The system is designed for small-scale route optimization scenarios with a minimum of 2 and a maximum of 15 locations.

---

# Features

- Route optimization using Genetic Algorithms
- Google Maps Distance Matrix integration
- Interactive frontend built with React
- Backend API built with FastAPI
- Firebase Authentication
- Real-time route validation and optimization
- Modular architecture for independent development

---

# Project Architecture

```text
Frontend (React)
        ↓
Firebase Authentication
        ↓
FastAPI Backend
        ↓
Google Maps Distance Matrix API
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
| Maps API | Google Maps Distance Matrix API |
| Authentication | Firebase Auth |
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
- Basic optimization endpoint
- Project diagrams

## In Progress

- Google Maps API integration
- Distance matrix generation
- Genetic algorithm implementation
- Frontend optimization interface

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
Distance Matrix Generation
    ↓
Genetic Algorithm Execution
    ↓
Optimized Route Response
```

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