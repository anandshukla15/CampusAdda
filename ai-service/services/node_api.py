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
    except requests.RequestException:
        return []


def index_event(event):
    try:
        response = requests.post(
            f"{BASE_URL}/events/index",
            json=event,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException:
        return {"status": "skipped"}
