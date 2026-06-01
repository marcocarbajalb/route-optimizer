# Frontend Documentation

The frontend is a React 19 + Vite application that authenticates users with Firebase, collects 2–15 destination coordinates, calls the deployed backend Cloud Function, and renders the optimized route on an interactive Google Map with numbered pins and total distance.

## Stack

- React 19 — UI framework
- Vite 8 — dev server and build tool
- `@react-google-maps/api` — map rendering and Places Autocomplete
- Firebase Authentication — email/password sign-in
- axios — HTTP client for Cloud Function calls

## Folder Structure

```text
frontend/
├── package.json              (Node dependencies - required)
├── package-lock.json         (Locked dependency versions - required)
├── vite.config.js
├── index.html
├── .env.example              (Environment variable template)
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx               (Auth state, request orchestration, route rendering)
    ├── index.css
    ├── components/
    │   ├── Login.jsx         (Firebase email/password sign-in and registration)
    │   ├── DestinationForm.jsx (Destination input, geocoding fallback, validation)
    │   └── MapComponent.jsx  (Map display, route polyline, numbered markers)
    ├── services/
    │   ├── firebase.js       (Firebase app initialization)
    │   └── cloudFunction.js  (Authenticated POST to the Cloud Function)
    └── utils/
        └── distance.js       (Haversine distance and 100 km validation)
```

## Key Modules

- **App.jsx** — Main shell; listens to Firebase auth state, builds optimization payload, calls Cloud Function, stores and displays result
- **components/Login.jsx** — Firebase email/password authentication UI
- **components/DestinationForm.jsx** — Destination input with Google Places Autocomplete, geocoding fallback, client-side 100 km validation
- **components/MapComponent.jsx** — Google Map with route polyline and numbered pins per destination
- **services/firebase.js** — Firebase app and auth initialization from `VITE_FIREBASE_*` environment variables
- **services/cloudFunction.js** — Authenticated POST request to `VITE_CLOUD_FUNCTION_URL` with error normalization
- **utils/distance.js** — Haversine distance calculation and 100 km radius enforcement

## Environment Variables

Copy `.env.example` to `.env` and populate all variables:

```bash
cp .env.example .env
```

```text
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
VITE_FIREBASE_API_KEY=<from-firebase-project-settings>
VITE_FIREBASE_AUTH_DOMAIN=<from-firebase-project-settings>
VITE_FIREBASE_PROJECT_ID=<from-firebase-project-settings>
VITE_FIREBASE_STORAGE_BUCKET=<from-firebase-project-settings>
VITE_FIREBASE_MESSAGING_SENDER_ID=<from-firebase-project-settings>
VITE_FIREBASE_APP_ID=<from-firebase-project-settings>
VITE_CLOUD_FUNCTION_URL=<deployed-function-url>
```

**⚠️ CRITICAL**: Do NOT commit `.env`. Add it to `.gitignore` (already configured). Only `.env.example` is tracked.

## Setup and Run

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and populate all values. See root `README.md` for setup details.

### 3. Run development server

```bash
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`).

## Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Dependencies

`package.json` and `package-lock.json` are required for reproducible installs. Commit both to version control.

## Notes

- The frontend requires a deployed backend Cloud Function URL in `VITE_CLOUD_FUNCTION_URL`
- Backend enforces IP allowlist restrictions; to test from a new machine, add its IP to `ALLOWED_IPS` and redeploy
- Firebase authentication is required; unauthenticated users cannot call the optimization function
- The Haversine distance check is performed client-side for fast feedback; the backend performs the same check as the authoritative validation
