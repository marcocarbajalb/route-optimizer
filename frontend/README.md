# Frontend Documentation

Frontend for the Route Optimizer platform: a **React + Vite** single-page app that authenticates the user with Firebase, collects 2–15 destinations, calls the deployed Cloud Function, and visualizes the optimized route on an interactive Google map with a numbered pin per stop and the total distance on screen.

The frontend runs locally only (no deploy is planned); it always calls the **deployed** Cloud Function.

---

## Frontend Stack

| Technology | Purpose |
|---|---|
| React 19 | UI |
| Vite 8 | Dev server and build |
| `@react-google-maps/api` | Map, Places Autocomplete, Directions, Geocoding |
| Firebase (Auth) | Email/password authentication |
| axios | Calls to the Cloud Function |

---

## Design

The interface is a minimalist "cartographic" layout: a full-screen, natively colored Google map as the background, with a floating frosted-glass control panel on the left and a small user chip on the top-right.

- **Accent**: amber `#ea580c` (brand color, used sparingly).
- **Route polyline**: light blue `#2f7dd1`.
- **Numbered pins**: orange `#ea580c`. For a closed route, the origin pin carries an "S/E" (start/end) label.
- **Favicon**: a custom "route nodes" mark on an amber badge.
- **Fonts**: Sora (display), Manrope (body), JetBrains Mono (metrics), loaded in `index.html`.
- Light and dark themes are both supported via CSS variables, and the layout is responsive (the panel spans the width on small screens).

---

## Folder Structure

```text
frontend/
├── index.html                    # Fonts + root mount
├── vite.config.js
├── package.json
├── .env.example                  # Required frontend variables (no real values)
├── public/
│   └── favicon.svg               # Route-nodes brand mark
└── src/
    ├── main.jsx                  # React entry
    ├── App.jsx                   # App shell, auth state, optimization flow
    ├── index.css                 # Design system (tokens, glass, layout)
    ├── components/
    │   ├── Login.jsx             # Firebase email/password sign-in / register
    │   ├── DestinationForm.jsx   # 2–15 destinations, validation, route mode
    │   └── MapComponent.jsx      # Map, route polyline, numbered pins
    ├── services/
    │   ├── firebase.js           # Firebase app + auth init
    │   └── cloudFunction.js      # axios call to the Cloud Function
    └── utils/
        └── distance.js           # Haversine + 100 km radius check
```

---

## Components and Modules

### `App.jsx`

The app shell and state owner. It listens to Firebase auth state, shows `Login` when signed out, and otherwise renders the map plus the control panel. It builds the request payload, attaches the Firebase ID token, calls the Cloud Function, and holds the result.

Key behavior: the route and pins are committed **only after a successful run**, and the map is cleared on any failure — both backend errors (caught from the request) and client-side validation errors (via the `onValidationError` callback) — so a stale route is never shown next to a fresh error. A "Clear route" button appears only once a route exists and soft-resets the form by remounting it (via a changing `key`), without reloading the page.

### `components/Login.jsx`

Firebase email/password authentication, with a toggle between sign-in and account creation. Surfaces auth errors inline.

### `components/DestinationForm.jsx`

The destination editor. It manages 2–15 dynamic inputs (add/remove), a closed/open route segmented control, and all client-side validation.

- **Google Places Autocomplete** on each input, restricted to Guatemala (`componentRestrictions: { country: 'gt' }`) and requesting only the fields the app uses (`name`, `formatted_address`, `geometry`, `address_components`) to keep responses light and within the Basic Data billing tier.
- Builds a concise, distinguishable **"Name; City/Zone"** label for each picked place.
- On submit, any destination without coordinates is resolved via the **Geocoding API** as a fallback; the user's own typed text is preserved as the label rather than being replaced by a plus code or "Unnamed Road".
- Enforces the **100 km radius** with the Haversine check before calling the API, and highlights the offending fields. On any validation failure it shows an inline message and notifies the parent (so the map is cleared).

### `components/MapComponent.jsx`

Renders the Google map and the result. It uses `DirectionsRenderer` for the route polyline (markers suppressed) and draws its own numbered SVG teardrop pins anchored at each stop. It detects a closed route (origin ID repeated at the end), strips the duplicate so pins don't overlap, and labels the origin pin "S/E". Before optimization, it shows plain pins for the entered destinations.

### `services/firebase.js`

Initializes the Firebase app from the `VITE_FIREBASE_*` variables and exports the `auth` instance.

### `services/cloudFunction.js`

`optimizeRoute(payload, token)` sends the authenticated `POST` to `VITE_CLOUD_FUNCTION_URL` with axios. It normalizes backend and network errors into a single user-facing message (stripping Pydantic's `Value error, ` prefix and mapping `401`/`403` to friendly text).

### `utils/distance.js`

`haversineDistanceKm(...)` mirrors the backend's great-circle formula, and `findDestinationsOverRadius(...)` returns the IDs in any over-limit pair plus the worst offending pair for the error message. `MAX_RADIUS_KM` is 100.

---

## Environment Variables

All variables are `VITE_*` (exposed to the client at build time). Copy the template and fill in your values:

```bash
cp .env.example .env
```

```text
# Google Maps JavaScript API (map + autocomplete + geocoding)
VITE_GOOGLE_MAPS_API_KEY=

# Firebase Authentication config (from your Firebase project settings)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Deployed Cloud Function endpoint
VITE_CLOUD_FUNCTION_URL=
```

`.env` is git-ignored and must never be committed; only `.env.example` is tracked.

---

## Running

Requires Node.js 20.19+ (22.13+ on the v22 line) and npm.

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite (by default `http://localhost:5173`). Register or sign in, add your destinations, choose a route mode, and run the optimization.

Other scripts:

```bash
npm run build     # production build
npm run preview   # preview the production build
npm run lint      # ESLint
```

> The deployed Cloud Function only accepts requests from the IPs listed in the backend's `ALLOWED_IPS`. To call it from your machine during development, add your current public IP to that list and redeploy the function. See the [root README](../README.md) for the full setup.