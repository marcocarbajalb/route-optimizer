"""Firebase Cloud Function entry point for the Route Optimizer.

This module exposes a single HTTP-triggered function that receives
destination coordinates and a calculation mode, runs the genetic
algorithm, and returns the optimized route.
"""
import json
import logging

from firebase_functions import https_fn, options
from firebase_admin import initialize_app
from pydantic import ValidationError

from shared.schemas import OptimizationRequestSchema
from services.optimization_service import optimize_route
from auth.firebase_auth import verify_firebase_token
from security.ip_filter import is_ip_allowed, get_client_ip

# Firebase Admin SDK uses the runtime service account automatically.
initialize_app()

# CORS: restrict to the deployed frontend origin in production.
_CORS = options.CorsOptions(
    cors_origins=["http://localhost:5173"],
    cors_methods=["POST", "OPTIONS"],
)


@https_fn.on_request(
    cors=_CORS,
    region="us-central1",
    secrets=["GOOGLE_MAPS_API_KEY"],
)
def optimize(req: https_fn.Request) -> https_fn.Response:
    """HTTP entry point: validates, authorizes, and runs the optimization."""

    # 1. Method guard
    if req.method != "POST":
        return https_fn.Response("Method Not Allowed", status=405)

    # 2. IP allowlist enforcement (PDF requirement)
    client_ip = get_client_ip(req)
    if not is_ip_allowed(client_ip):
        return https_fn.Response(
            json.dumps({"error": "Forbidden: IP address not allowed"}),
            status=403,
            mimetype="application/json",
        )

    # 3. Firebase Authentication enforcement
    auth_header = req.headers.get("Authorization", "")
    if not verify_firebase_token(auth_header):
        return https_fn.Response(
            json.dumps({"error": "Unauthorized: invalid or missing token"}),
            status=401,
            mimetype="application/json",
        )

    # 4. Request body validation via Pydantic
    try:
        body = req.get_json(silent=True)
        if not isinstance(body, dict):
            raise ValueError("Request body must be a JSON object")
        request_data = OptimizationRequestSchema(**body)
    except (ValidationError, ValueError) as exc:
        return https_fn.Response(
            json.dumps({"error": str(exc)}),
            status=422,
            mimetype="application/json",
        )

    # 5. Run optimization pipeline
    try:
        result = optimize_route(request_data)
    except Exception as exc:  # noqa: BLE001 - surface upstream API failures
        # Log the real cause for debugging (visible in Cloud Logging), but never expose upstream/internal detail to the caller.
        logging.exception("Optimization pipeline failed")
        return https_fn.Response(
            json.dumps({"error": "Optimization failed due to an internal error"}),
            status=502,
            mimetype="application/json",
        )

    return https_fn.Response(
        result.model_dump_json(),
        status=200,
        mimetype="application/json",
    )