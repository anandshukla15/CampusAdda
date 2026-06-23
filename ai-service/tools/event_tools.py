from services.node_api import search_events

def find_events(query):

    data = search_events(query)

    return str(data)