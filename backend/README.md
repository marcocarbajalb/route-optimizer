# Backend Documentation

The backend is a Firebase Cloud Function written in Python 3.12. It receives authenticated requests with destination coordinates, validates input, builds a real road-distance matrix from Google Maps, runs a genetic algorithm, and returns the optimized route order and total distance.

## Stack

- Firebase Cloud Functions (Python)
- Python 3.12
- Pydantic (request validation)
- Google Maps Distance Matrix API
- Firebase Authentication
- Firebase Secret Manager
- uv (Python package manager)

`firebase.json` configures the function source as `backend` and runtime as `python312`.

## Folder Structure

```text
backend/
├── main.py                   (Cloud Function entry point)
├── pyproject.toml            (Python dependencies - required)
├── uv.lock                   (Locked versions - required for reproducibility)
├── requirements.txt          (Generated from pyproject.toml, installed by Firebase)
├── .env.example              (Environment variable template)
├── auth/
│   └── firebase_auth.py      (Firebase ID token verification)
├── security/
│   └── ip_filter.py          (IP allowlist enforcement)
├── matrix_engine/
│   └── distance_matrix.py    (Google Maps Distance Matrix API)
├── genetic_engine/
│   └── genetic_algorithm.py  (Genetic algorithm implementation)
├── services/
│   └── optimization_service.py (Orchestrates distance matrix + genetic algorithm)
└── shared/
    └── schemas.py            (Pydantic models and validation)
```

## Request Pipeline

Every request flows through these sequential stages in `main.py`:

1. **Method guard**: Only `POST` is accepted; others return `405 Method Not Allowed`.
2. **IP allowlist**: Caller IP is extracted from `X-Forwarded-For` and checked against `ALLOWED_IPS`. Non-allowed IPs return `403 Forbidden`. If `ALLOWED_IPS` is empty, all requests are rejected (fail-closed).
3. **Authentication**: `Authorization: Bearer <id_token>` header is verified with Firebase. Invalid or missing tokens return `401 Unauthorized`.
4. **Validation**: JSON body is validated with Pydantic, enforcing 2–15 destinations, unique IDs, and 100 km maximum pairwise distance. Invalid payloads return `422 Unprocessable Entity`.
5. **Optimization**: Distance matrix is constructed from Google Maps, and the genetic algorithm runs. Failures return `502 Bad Gateway`.

Successful responses return `200 OK` with the optimized route as JSON.

## API Contract

### Request

```json
{
  "locations": [
    { "id": "A", "lat": 14.6349, "lng": -90.5069 },
    { "id": "B", "lat": 14.6248, "lng": -90.5328 }
  ],
  "config": {
    "is_closed_route": true
  }
}
```

### Successful Response (200 OK)

```json
{
  "route": {
    "ordered_locations": ["A", "B", "A"],
    "total_distance_km": 10.75
  }
}
```

### Error Responses

- `200 OK` — route successfully optimized
- `401 Unauthorized` — invalid or missing Firebase ID token
- `403 Forbidden` — IP not in `ALLOWED_IPS` or allowlist empty
- `405 Method Not Allowed` — only `POST` is accepted
- `422 Unprocessable Entity` — request validation failed (count, duplicates, 100 km radius, malformed JSON)
- `502 Bad Gateway` — optimization or external API failure

## Deployment

### 1. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set `ALLOWED_IPS` to a comma-separated list of allowed public IPs. If empty, all requests are rejected.

### 2. Store Google Maps API key

```bash
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```

You will be prompted to paste the key. It is stored only in Firebase Secret Manager and injected at runtime.

### 3. Install dependencies

```bash
cd backend
uv sync
uv pip compile pyproject.toml -o requirements.txt
```

- `pyproject.toml` declares direct dependencies
- `uv.lock` pins exact versions for reproducibility
- `requirements.txt` is generated and used by Firebase at deploy time

### 4. Deploy

```bash
firebase deploy --only functions
```

Use the Firebase alias configured in `.firebaserc`:

```bash
firebase use route-optimizer
```

## Security

- **Firebase ID token validation** on every request
- **IP allowlist enforcement** before any processing (fail-closed)
- **`GOOGLE_MAPS_API_KEY`** stored only in Firebase Secret Manager, never in code or `.env`
- **CORS restriction** to `http://localhost:5173` for development

## Notes

- The function runs in `us-central1` region
- The function declares `secrets=["GOOGLE_MAPS_API_KEY"]` so the key is injected only at runtime
- The function does not run locally; it is exercised only through the deployed Cloud Function
- For local development, create a virtual environment with `uv sync` to test modules independently
