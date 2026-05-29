"""Application-level IP allowlist enforcement.

This is a defense-in-depth layer. The primary IP restriction is
configured in GCP (ingress settings / Cloud Armor). The allowlist
is provided via the ALLOWED_IPS environment variable as a
comma-separated list of IPv4 addresses.
"""
import os

from firebase_functions import https_fn


def _load_allowed_ips() -> set[str]:
    """Parses the ALLOWED_IPS environment variable into a set."""
    raw = os.environ.get("ALLOWED_IPS", "")
    return {ip.strip() for ip in raw.split(",") if ip.strip()}


def get_client_ip(req: https_fn.Request) -> str:
    """Extracts the originating client IP from the request.

    Cloud Functions sit behind Google's load balancer, so the real
    client IP is the first entry of the 'X-Forwarded-For' header.
    """
    forwarded = req.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return req.remote_addr or ""


def is_ip_allowed(client_ip: str) -> bool:
    """Returns True if the client IP is in the configured allowlist.

    If ALLOWED_IPS is empty, all requests are rejected (fail-closed).
    """
    allowed = _load_allowed_ips()
    if not allowed:
        return False
    return client_ip in allowed