"""Builds the distance matrix using the Google Maps Distance Matrix API."""
import os
import requests


def build_distance_matrix(locations: list[tuple[float, float]]) -> list[list[float]]:
    """
    Builds a real distance matrix using Google Maps Distance Matrix API.
    Returns distances in kilometers.
    """
    # Read the secret at call time, not at import time.
    # In Cloud Functions the secret is injected into the environment
    # only for functions that declare it via secrets=[...].
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_MAPS_API_KEY is not set")

    size = len(locations)
    locations_str = "|".join([f"{lat},{lng}" for lat, lng in locations])

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": locations_str,
        "destinations": locations_str,
        "key": api_key,
    }

    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    if data.get("status") != "OK":
        raise Exception(f"Google Maps API error: {data.get('status')}")

    matrix: list[list[float]] = [[0.0 for _ in range(size)] for _ in range(size)]

    for i, row in enumerate(data["rows"]):
        for j, element in enumerate(row["elements"]):
            if element.get("status") == "OK":
                matrix[i][j] = element["distance"]["value"] / 1000.0
            else:
                matrix[i][j] = float("inf")

    return matrix