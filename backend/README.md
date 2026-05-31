# Backend Documentation

Backend for the Route Optimizer platform.

The backend is a single HTTP-triggered **Firebase Cloud Function** written in **Python 3.12**. It receives a set of destinations and a route mode, authorizes the caller, validates the request, builds a real road-distance matrix from the Google Maps Distance Matrix API, runs a genetic algorithm to find the optimal visiting order, and returns the ordered route with its total distance as JSON.

There is no local server and no REST framework. The frontend always calls the deployed function.

---

## Backend Stack

| Technology | Purpose |
|---|---|
| Firebase Cloud Functions (Python) | Serverless HTTP entry point (`optimize`) |
| Python 3.12 | Core backend language |
| Pydantic | Request validation and response serialization |
| Google Maps Distance Matrix API | Real road distances between destinations |
| Firebase Authentication | ID token verification |
| Firebase Secret Manager | Storage for the Google Maps API key |
| uv | Python dependency management |

---

## Request Pipeline

The function (`optimize` in `main.py`) processes every request through these stages, in order. Any stage that fails short-circuits with an appropriate HTTP status, so no work is done for a request that should be rejected.

1. **Method guard** — only `POST` is accepted; anything else returns `405 Method Not Allowed`.
2. **IP allowlist** — the caller IP is checked against `ALLOWED_IPS` before any other work. A non-listed IP (or an empty allowlist) returns `403 Forbidden`. This is fail-closed.
3. **Authentication** — the `Authorization: Bearer <id_token>` header is verified against Firebase. A missing or invalid token returns `401 Unauthorized`.
4. **Validation** — the JSON body is parsed and validated with Pydantic (2–15 destinations, no duplicate IDs, 100 km radius). Invalid input returns `422 Unprocessable Entity`.
5. **Optimization** — the distance matrix is built and the genetic algorithm runs. Upstream failures (e.g. a Distance Matrix API error) return `502 Bad Gateway`.

On success the function returns `200 OK` with the optimized route as JSON.

The function declares its secret (`secrets=["GOOGLE_MAPS_API_KEY"]`) and restricts CORS to the local frontend origin (`http://localhost:5173`) for `POST`/`OPTIONS`, in region `us-central1`.

---

## Folder Structure

```text
backend/
├── main.py                       # HTTP entry point: method guard → IP filter → auth → validation → pipeline
├── pyproject.toml                # Direct dependencies (managed with uv)
├── uv.lock                       # Locked dependency versions
├── requirements.txt              # Generated from pyproject.toml; installed by Firebase at deploy
├── .python-version               # Pins the local interpreter to 3.12
├── .env.example                  # Backend variables template (no real values)
│
├── auth/
│   └── firebase_auth.py          # verify_firebase_token
│
├── security/
│   └── ip_filter.py              # get_client_ip, is_ip_allowed (fail-closed)
│
├── matrix_engine/
│   └── distance_matrix.py        # Google Maps Distance Matrix API calls
│
├── genetic_engine/
│   └── genetic_algorithm.py      # Genetic algorithm implementation
│
├── services/
│   └── optimization_service.py   # Orchestrates the matrix engine and the genetic algorithm
│
└── shared/
    └── schemas.py                # Pydantic models + validation + Haversine helper
```

Each package directory also contains an empty `__init__.py`.

---

## Core Modules

### `main.py`

The Cloud Function entry point. Wires the request pipeline described above and initializes the Firebase Admin SDK (which uses the runtime service account automatically).

### `auth/firebase_auth.py`

`verify_firebase_token(authorization_header)` extracts the bearer token from the raw `Authorization` header and verifies it with the Firebase Admin SDK. Returns the decoded token payload when valid, or `None` for any malformed, missing, or invalid token.

### `security/ip_filter.py`

Application-level IP allowlist enforcement (a defense-in-depth layer; the primary IP restriction can also be configured in GCP ingress settings / Cloud Armor).

- `get_client_ip(req)` reads the real client IP from the first entry of the `X-Forwarded-For` header, since the function sits behind Google's load balancer.
- `is_ip_allowed(client_ip)` checks the IP against the set parsed from `ALLOWED_IPS`. If the allowlist is empty, it returns `False` — all requests are rejected (fail-closed).

### `matrix_engine/distance_matrix.py`

`build_distance_matrix(locations)` returns a square matrix of real road distances in kilometers, using the Google Maps Distance Matrix API.

Because the full origins × destinations matrix can exceed the API's limit (100 elements and 25 dimensions per request — e.g. 15 × 15 = 225 elements), destinations are kept fixed as the full set while origins are paged in blocks of 5. With up to 15 locations, each request stays at 5 × 15 = 75 elements, within both caps. The returned rows are stitched back into a single matrix. Unreachable pairs (e.g. `ZERO_RESULTS`) are marked as infinite so the genetic algorithm naturally avoids that leg.

The Google Maps API key is read from the environment at call time (not at import time), because Secret Manager injects it only at runtime for functions that declare it.

### `genetic_engine/genetic_algorithm.py`

The genetic algorithm, treating the route as a Traveling Salesman Problem.

- `calculate_route_distance(route, matrix, is_closed_route)` — total distance of a route; for closed routes it adds the return leg to the origin.
- `order_crossover(parent1, parent2)` — Order Crossover (OX1) that keeps the origin fixed at index 0 and produces a child with no duplicated or missing stops.
- `mutate(route, mutation_rate)` — swap mutation between two non-origin stops, applied according to the mutation rate.
- `solve(...)` — the main loop: initializes a random population (origin fixed at index 0), evolves it for a fixed number of generations using tournament selection (k = 3), OX1 crossover, swap mutation, and elitism (the top individuals carry over), and returns the best route found and its distance.

### `services/optimization_service.py`

`optimize_route(request)` is the orchestration layer between the engines. It extracts coordinates from the validated request, builds the distance matrix, runs the genetic algorithm with the fixed backend hyperparameters, maps the resulting indices back to the original location IDs, and (for closed routes) appends the origin ID at the end of the list. It returns the response model.

### `shared/schemas.py`

The Pydantic data contracts and validation, plus a Haversine helper.

- `LocationSchema` — `id`, `lat` (−90…90), `lng` (−180…180).
- `OptimizationConfigSchema` — only `is_closed_route` (the route mode chosen by the user). The genetic hyperparameters (population size, generations, mutation rate) are fixed in `services/optimization_service.py` and are deliberately not part of the request contract, so a caller cannot influence the GA's runtime or cost. Unknown fields in `config` are rejected (`extra="forbid"`).
- `OptimizationRequestSchema` — `locations` + `config`. Its validator enforces the 2–15 count, rejects duplicate IDs, and checks every pair of destinations against the 100 km limit using the Haversine formula (the authoritative server-side check).
- `RouteSchema` / `OptimizationResponseSchema` — the response shape.

---

## The `optimize` Endpoint

```http
POST <deployed-function-url>
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

### Request body

`config` is optional; when omitted, the backend defaults are used. The frontend sends only `is_closed_route` inside `config`. Extra fields on a location (such as a display `name`) are ignored by the schema.

```json
{
  "locations": [
    { "id": "A", "lat": 14.6349, "lng": -90.5069 },
    { "id": "B", "lat": 14.6248, "lng": -90.5328 },
    { "id": "C", "lat": 14.6111, "lng": -90.5133 }
  ],
  "config": {
    "is_closed_route": true
  }
}
```

### Successful response

`ordered_locations` is the optimal visiting order by location ID. For a closed route the origin ID is repeated at the end to represent the return leg. `total_distance_km` is the total road distance in kilometers.

```json
{
  "route": {
    "ordered_locations": ["A", "C", "B", "A"],
    "total_distance_km": 12.84
  }
}
```

### Error responses

| Status | Meaning |
|---|---|
| `403 Forbidden` | Caller IP is not in `ALLOWED_IPS` (or the allowlist is empty) |
| `401 Unauthorized` | Missing or invalid Firebase ID token |
| `422 Unprocessable Entity` | Body failed validation (count, duplicate IDs, 100 km radius, malformed JSON) |
| `405 Method Not Allowed` | Method other than `POST` |
| `502 Bad Gateway` | Optimization failed (e.g. a Distance Matrix API error) |

All errors are returned as `{ "error": "..." }`.

---

## Validation Rules

- Minimum destinations: 2
- Maximum destinations: 15
- All destinations must lie within a maximum radius of 100 km of each other
- Geographic coordinates are required for every destination
- Duplicate destination IDs are not allowed

The 100 km radius is enforced here (Pydantic) as the authoritative check. The frontend also runs the same Haversine check for fast feedback before calling the function.

---

## Security

- **Authentication**: every request must carry a valid Firebase ID token; unauthenticated calls are rejected with `401`.
- **IP allowlist**: the caller IP is checked against `ALLOWED_IPS` before any work; non-listed IPs are rejected with `403`. An empty allowlist rejects everything (fail-closed).
- **Secrets and configuration**: the Google Maps API key lives in Firebase Secret Manager and is injected only at runtime; the IP allowlist lives in the git-ignored `backend/.env`. No API keys or credentials are committed to the repository — only `.env.example` is tracked.

---

## Dependencies

Direct dependencies are declared in `pyproject.toml` and managed with **uv**:

- `firebase-admin` — Firebase Admin SDK (auth verification)
- `firebase-functions` — Cloud Functions Python SDK
- `pydantic` — request validation
- `requests` — Distance Matrix API calls

`uv.lock` pins exact versions for reproducible installs. `requirements.txt` is generated from `pyproject.toml` and is what **Firebase installs automatically at deploy time**:

```bash
uv pip compile pyproject.toml -o requirements.txt
```

> `uvicorn` and `starlette` appear in `requirements.txt` only as transitive dependencies of the Functions Framework; they are not used directly by this backend. The previous stack's direct dependencies (`fastapi`, `uvicorn`, `python-dotenv`) were removed during cleanup.

---

## Running and Deploying

This backend has no local run mode — it is exercised through the deployed function. For local development you can still create a virtual environment from the lockfile:

```bash
cd backend
uv sync
```

### Set the Google Maps API key (once per project)

```bash
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
```

### Configure the IP allowlist

Set `ALLOWED_IPS` in `backend/.env` (comma-separated public IPs). Firebase ships `backend/.env` as runtime environment variables on each deploy, so updating the allowlist means editing `.env` and redeploying.

### Deploy

```bash
firebase deploy --only functions
```

The CLI prints the function URL on success; the frontend consumes it via `VITE_CLOUD_FUNCTION_URL`.

For full setup and prerequisites, see the [root README](../README.md).