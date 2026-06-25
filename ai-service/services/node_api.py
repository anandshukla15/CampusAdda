import requests

BASE_URL = "http://localhost:5000/api/ai"

def search_events(query):
    try:
        response = requests.get(
            f"{BASE_URL}/events/search",
            params={"q": query},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as error:
        return {
            "error": f"Could not reach Campus Adda event API: {error}",
            "events": []
        }
