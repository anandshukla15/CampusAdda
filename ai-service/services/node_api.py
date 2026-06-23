import requests

BASE_URL = "http://localhost:5000/api/ai"

def search_events(query):

    response = requests.get(
        f"{BASE_URL}/events/search",
        params={"q": query}
    )

    return response.json()