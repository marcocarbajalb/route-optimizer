"""Firebase Authentication token verification."""
from firebase_admin import auth


def verify_firebase_token(authorization_header: str) -> dict | None:
    """Verifies a Firebase ID token from a raw 'Authorization' header.

    Returns the decoded token payload if valid, otherwise None.
    Expected header format: 'Bearer <id_token>'.
    """
    if not authorization_header.startswith("Bearer "):
        return None

    id_token = authorization_header.split("Bearer ", 1)[1].strip()
    if not id_token:
        return None

    try:
        return auth.verify_id_token(id_token)
    except Exception:  # noqa: BLE001 - any failure means an invalid token
        return None