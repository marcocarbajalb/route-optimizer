# Route Optimizer

> Route optimization using genetic algorithms, Firebase, React, and Google Maps API.

Route Optimizer is a complete web application that computes the optimal route for 2–15 destinations within a 100 km radius. The project implements a genetic algorithm on a serverless Firebase Cloud Function and visualizes the result on an interactive Google map with numbered pins per destination.

## General Description

Route Optimizer applies a **genetic algorithm** to solve the Traveling Salesman Problem (TSP) for real-world route planning. Given 2–15 destinations within a 100 km radius, the application computes an optimal or near-optimal visiting order. Users authenticate via Firebase, specify their destinations with Google Maps integration, choose between closed routes (returning to origin) and open routes (ending at the last destination), and receive an optimized route with total distance.

### Algorithm Implementation

The genetic algorithm uses:
- **Selection**: Tournament selection (k=3 competitors)
- **Crossover**: Order Crossover (OX1) to preserve destination ordering
- **Mutation**: Swap mutation to explore neighbor solutions
- **Elitism**: Preserves the best 2 solutions across generations
- **Fitness**: Route total distance (minimized)

This approach balances computation time with solution quality for real-time route optimization on the backend.

## Architecture

- **Frontend**: React 19 + Vite SPA with Firebase Authentication
- **Backend**: Python 3.12 Firebase Cloud Function
- **Optimization**: Genetic algorithm (tournament selection, Order Crossover, swap mutation, elitism)
- **Distance service**: Google Maps Distance Matrix API
- **Security**: Firebase ID token validation, IP allowlist enforcement on the backend

```
User (Browser)
    ↓ Firebase ID token + destinations
Deployed Cloud Function (Python)
    ├── IP allowlist check
    ├── Firebase auth verification
    ├── Request validation (2–15 destinations, unique IDs, 100 km radius)
    ├── Distance matrix (Google Maps API)
    └── Genetic algorithm optimization
    ↓
React frontend renders optimized route on Google Maps
```

## Repository Structure

```text
route-optimizer/
├── README.md
├── .gitignore
├── .firebaserc
├── firebase.json
├── backend/
│   ├── main.py
│   ├── pyproject.toml          (Python dependencies - required)
│   ├── uv.lock                 (Locked dependency versions - required)
│   ├── requirements.txt
│   ├── .env.example
│   ├── auth/
│   ├── security/
│   ├── matrix_engine/
│   ├── genetic_engine/
│   ├── services/
│   └── shared/
├── frontend/
│   ├── package.json            (Node dependencies - required)
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── index.html
│   ├── .env.example
│   ├── public/
│   └── src/
└── diagrams/
    ├── flow.drawio
    └── architecture.drawio
```

## Requirements

- Node.js 20.19 or newer
- Python 3.12
- uv (Python package manager)
- Firebase CLI (`npm install -g firebase-tools`)
- Firebase project with Authentication and Cloud Functions enabled
- Google Maps API key with:
  - Maps JavaScript API
  - Places API
  - Geocoding API
  - Distance Matrix API

## Setup Instructions

### Step 1: Clone and configure Firebase

```bash
git clone <repository-url>
cd route-optimizer
firebase login
firebase use route-optimizer
```

### Step 2: Backend setup

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set `ALLOWED_IPS` to a comma-separated list of allowed public IPs (e.g., `203.0.113.4,198.51.100.20`). If empty, all requests are rejected.

Install dependencies and verify:

```bash
uv sync
uv pip compile pyproject.toml -o requirements.txt
```

Store the Google Maps API key in Firebase Secret Manager:

```bash
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```

Deploy the Cloud Function:

```bash
firebase deploy --only functions
```

When deployment completes, copy the printed function URL.

### Step 3: Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
```

Edit `frontend/.env` and populate:
- `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key
- Firebase config variables (`VITE_FIREBASE_*`)
- `VITE_CLOUD_FUNCTION_URL`: The deployed function URL from Step 2

### Step 4: Run locally

```bash
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`). Sign in with Firebase and start planning routes.

## Security Notes

- **⚠️ CRITICAL**: Do NOT commit `.env` files or API keys to the repository. The grading system automatically assigns 0 points if credentials are found.
- `.env.example` files document required variables without real values.
- `ALLOWED_IPS` is fail-closed: an empty list rejects all requests.
- `GOOGLE_MAPS_API_KEY` is stored only in Firebase Secret Manager, never in code.

## Dependency Files

The project includes dependency manifests for reproducible builds:
- `backend/pyproject.toml` and `backend/uv.lock` — Python dependencies (managed with uv)
- `frontend/package.json` and `frontend/package-lock.json` — Node dependencies

## Key Technologies

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, `@react-google-maps/api` |
| Backend | Python 3.12, Firebase Functions, Pydantic |
| Optimization | Genetic algorithm |
| Authentication | Firebase Authentication |
| Distance API | Google Maps Distance Matrix API |
| Package management | uv (Python), npm (Node) |

## Documentation

- `backend/README.md` — Backend function, request pipeline, deployment details
- `frontend/README.md` — Frontend components, environment setup, running locally
- `diagrams/flow.drawio` — User flow from login to route visualization
- `diagrams/architecture.drawio` — System architecture with GCP icons

## Contributors

| Name | ID |
|---|---|
| Marco Carbajal | 23025 |
| Carlos Aldana | 23394 |
| Diego Monroy | 23318 |
| Carlos Angel | 23010 |
