"""Builds the distance matrix using the Google Maps Distance Matrix API."""
import os

import requests

# Distance Matrix API limits (server-side):
#   - Max 25 origins or 25 destinations per request.
#   - Max 100 elements per request, where elements = origins * destinations.
# We fix all destinations as the column axis and page the origins in blocks.
# With up to 15 locations, a block of 5 origins yields at most 5 * 15 = 75
# elements per request, staying within both the 100-element and 25-dimension caps.
_MAX_ORIGINS_PER_REQUEST = 5

_DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"


def _format_locations(locations: list[tuple[float, float]]) -> str:
    """Formats coordinate pairs into the 'lat,lng|lat,lng' query string."""
    return "|".join(f"{lat},{lng}" for lat, lng in locations)


def _request_block(
    origins: list[tuple[float, float]],
    destinations: list[tuple[float, float]],
    api_key: str,
) -> dict:
    """Performs a single Distance Matrix request for a block of origins."""
    params = {
        "origins": _format_locations(origins),
        "destinations": _format_locations(destinations),
        "key": api_key,
    }

    response = requests.get(_DISTANCE_MATRIX_URL, params=params)
    response.raise_for_status()
    data = response.json()

    # Top-level status reflects the request as a whole (e.g. MAX_ELEMENTS_EXCEEDED,
    # MAX_DIMENSIONS_EXCEEDED, REQUEST_DENIED, OVER_QUERY_LIMIT).
    if data.get("status") != "OK":
        raise Exception(f"Google Maps API error: {data.get('status')}")

    return data


def build_distance_matrix(
    locations: list[tuple[float, float]],
) -> list[list[float]]:
    """
    Builds a real distance matrix using the Google Maps Distance Matrix API.
    Returns distances in kilometers.

    The full origins x destinations matrix can exceed the API's 100-element
    per-request limit (e.g. 15 x 15 = 225). To stay within limits, destinations
    are kept fixed while origins are paged in blocks of _MAX_ORIGINS_PER_REQUEST,
    and the resulting rows are stitched back into a single square matrix.
    """
    # Read the secret at call time, not at import time. In Cloud Functions the
    # secret is injected into the environment only for functions that declare
    # it via secrets=[...].
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_MAPS_API_KEY is not set")

    size = len(locations)
    matrix: list[list[float]] = [[0.0 for _ in range(size)] for _ in range(size)]

    # Page over the origin axis; destinations stay fixed as the full set.
    for start in range(0, size, _MAX_ORIGINS_PER_REQUEST):
        end = min(start + _MAX_ORIGINS_PER_REQUEST, size)
        origin_block = locations[start:end]

        data = _request_block(origin_block, locations, api_key)

        # Each returned row maps to a global origin index (start + local_i).
        for local_i, row in enumerate(data["rows"]):
            global_i = start + local_i
            for j, element in enumerate(row["elements"]):
                if element.get("status") == "OK":
                    matrix[global_i][j] = element["distance"]["value"] / 1000.0
                else:
                    # Unreachable pair (e.g. ZERO_RESULTS): mark as infinite so
                    # the genetic algorithm naturally avoids that leg.
                    matrix[global_i][j] = float("inf")

    return matrix