import requests
import uuid
import sys

url = "http://localhost:5173"
rand = str(uuid.uuid4())

# Create an event
post_event_res = requests.post(f"{url}/events", json={"event_name": f"event__{rand}", "event_location": f"location__{rand}"})
post_event_res.raise_for_status()
event_id = post_event_res.json()["id"]
print(post_event_res.json())
print("\n")

# Create athletes
post_athlete_res = requests.post(f"{url}/events/{event_id}/athletes", json={"athletes": [f"athlete__{id}__{rand}" for id in range(0,3)]})
post_athlete_res.raise_for_status()
print(post_athlete_res.json())
print("\n")

# Create routes
route_payload = {
    "route_name": f"route__{rand}",
    "turns": [
        {"turn_name": "Start Line", "latitude": 37.7749, "longitude": -122.4194},
        {"turn_name": "First Corner"},
        {"turn_name": "Finish Line", "latitude": 37.7750, "longitude": -122.4195}
    ]
}
post_route_res = requests.post(f"{url}/events/{event_id}/routes", json=route_payload)
post_route_res.raise_for_status()
print(post_route_res.json())
print("\n")


