import os
import requests
from dotenv import load_dotenv

# Load environment variables securely
load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

def build_distance_matrix(locations: list[tuple[float, float]]) -> list[list[float]]:
    """
    Builds a real distance matrix using Google Maps Distance Matrix API.
    Returns distances in kilometers.
    """
    if not GOOGLE_MAPS_API_KEY:
        raise ValueError("GOOGLE_MAPS_API_KEY is not set in the .env file")

    size = len(locations)
    
    # Format coordinates for the API: "lat,lng|lat,lng|..."
    locations_str = "|".join([f"{lat},{lng}" for lat, lng in locations])

    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": locations_str,
        "destinations": locations_str,
        "key": GOOGLE_MAPS_API_KEY
    }

    # Make the request to Google Maps
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()

    if data.get("status") != "OK":
        raise Exception(f"Google Maps API error: {data.get('status')}")

    # Initialize the matrix
    matrix: list[list[float]] = [
        [0.0 for _ in range(size)]
        for _ in range(size)
    ]

    # Parse Google's response to fill our matrix
    for i, row in enumerate(data["rows"]):
        for j, element in enumerate(row["elements"]):
            if element.get("status") == "OK":
                # Google Maps API returns distance in meters.
                # RouteSchema expects total distance in km, so we convert it:
                matrix[i][j] = element["distance"]["value"] / 1000.0
            else:
                # If Google cannot find a land route between two points, assign infinity
                matrix[i][j] = float('inf')

    return matrix