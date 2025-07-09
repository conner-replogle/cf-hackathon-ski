import requests
import os
import random

# --- Configuration ---
BASE_URL = "http://localhost:5173/api"
VIDEO_DIRECTORY = "videos"

# --- Geographic Data for Ski Trails ---
# Defines a set of famous ski trails at Jackson Hole, with 5 coordinate points for each.
SKI_TRAILS = {
    "Jackson Hole": {
        "Corbet's Couloir": [
            {"lat": 43.5948, "lon": -110.8545, "name": "The Drop In"},
            {"lat": 43.5945, "lon": -110.8542, "name": "The Choke"},
            {"lat": 43.5942, "lon": -110.8539, "name": "The Apron"},
            {"lat": 43.5939, "lon": -110.8536, "name": "Mid-Run"},
            {"lat": 43.5936, "lon": -110.8533, "name": "Run Out"}
        ],
        "Rendezvous Bowl": [
            {"lat": 43.5940, "lon": -110.8520, "name": "Bowl Entrance"},
            {"lat": 43.5935, "lon": -110.8515, "name": "Fall Line"},
            {"lat": 43.5930, "lon": -110.8510, "name": "Traverse"},
            {"lat": 43.5925, "lon": -110.8505, "name": "Lower Section"},
            {"lat": 43.5920, "lon": -110.8500, "name": "Meet the Groomer"}
        ],
         "The Hobacks": [
            {"lat": 43.5880, "lon": -110.8450, "name": "South Hoback Entry"},
            {"lat": 43.5875, "lon": -110.8440, "name": "The Glades"},
            {"lat": 43.5870, "lon": -110.8430, "name": "The Steeps"},
            {"lat": 43.5865, "lon": -110.8420, "name": "Creek Bed"},
            {"lat": 43.5860, "lon": -110.8410, "name": "Exit Flats"}
        ],
        "Tensleep Bowl": [
            {"lat": 43.5915, "lon": -110.8580, "name": "Tensleep Entry"},
            {"lat": 43.5908, "lon": -110.8572, "name": "First Pitch"},
            {"lat": 43.5901, "lon": -110.8564, "name": "The Funnel"},
            {"lat": 43.5894, "lon": -110.8556, "name": "Powder Fields"},
            {"lat": 43.5887, "lon": -110.8548, "name": "Lower Traverse Out"}
        ]
    }
}


# A map of entries to seed the database with.
SAMPLES = [
    {
        "athlete_name": "Yuto Horigome",
        "discipline": "Skateboarding",
        "events": [
            {
                "event_name": "Street League Skateboarding 2025",
                "runs": [
                    {
                        "run_name": "Run 1",
                        "turns": ["Nollie 270 Boardslide", "Switch Frontside 180 5-0"]
                    },
                    {
                        "run_name": "Best Trick 4",
                        "turns": ["Lazer Flip", "Hardflip Late 180"]
                    }
                ]
            }
        ]
    },
    {
        "athlete_name": "Sky Brown",
        "discipline": "Skateboarding",
        "events": [
            {
                "event_name": "X Games California 2025",
                "runs": [
                    {
                        "run_name": "Park Finals",
                        "turns": ["540 Stalefish", "Frontside Air", "Backside Smith Grind"]
                    }
                ]
            },
            {
                "event_name": "Vans Park Series 2025",
                "runs": [
                    {
                        "run_name": "Qualifying Heat",
                        "turns": ["Indy Air", "McTwist"]
                    }
                ]
            }
        ]
    },
    {
        "athlete_name": "Marcus Kleveland",
        "discipline": "Snowboarding",
        "events": [
            {
                "event_name": "Burton US Open 2025",
                "runs": [
                    { "run_name": "Slopestyle Run 2" },
                     { "run_name": "Big Air Final" }
                ]
            }
        ]
    },
    {
        "athlete_name": "Leticia Bufoni",
        "discipline": "Skateboarding",
        "events": [
            {
                "event_name": "Dew Tour 2025",
                "runs": [
                    {
                        "run_name": "Streetstyle Best Trick",
                        "turns": ["Feeble Grind to Fakie", "Kickflip Frontside Boardslide"]
                    }
                ]
            }
        ]
    },
    {
        "athlete_name": "Anna Gasser",
        "discipline": "Snowboarding",
        "events": [
            {
                "event_name": "Laax Open 2025",
                "runs": [
                    { "run_name": "Final Run" }
                ]
            }
        ]
    }
]


# --- Helper Functions ---

def create_athlete(name):
    """Creates a new athlete."""
    url = f"{BASE_URL}/athletes"
    try:
        response = requests.post(url, json={"athlete_name": name})
        response.raise_for_status()
        print(f"Athlete '{name}' created successfully.")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating athlete '{name}': {e}")
        if e.response:
            print(f"Response: {e.response.json()}")
        return None

def get_athletes():
    """Gets all athletes."""
    url = f"{BASE_URL}/athletes"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get('athletes', [])
    except requests.exceptions.RequestException as e:
        print(f"Error getting athletes: {e}")
        return []

def create_event(name):
    """Creates a new event."""
    url = f"{BASE_URL}/events"
    try:
        response = requests.post(url, json={"event_name": name})
        response.raise_for_status()
        print(f"Event '{name}' created successfully.")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating event '{name}': {e}")
        if e.response:
            print(f"Response: {e.response.json()}")
        return None

def get_events():
    """Gets all events."""
    url = f"{BASE_URL}/events"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get('events', [])
    except requests.exceptions.RequestException as e:
        print(f"Error getting events: {e}")
        return []

def create_run(name, event_id, athlete_id):
    """Creates a new run."""
    url = f"{BASE_URL}/runs"
    try:
        response = requests.post(url, json={"run_name": name, "event_id": event_id, "athlete_id": athlete_id})
        response.raise_for_status()
        print(f"Run '{name}' created successfully.")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating run '{name}': {e}")
        if e.response:
            print(f"Response: {e.response.json()}")
        return None

def get_runs_for_event(event_id):
    """Gets all runs for a given event."""
    url = f"{BASE_URL}/events/{event_id}/runs"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get('runs', [])
    except requests.exceptions.RequestException as e:
        print(f"Error getting runs for event {event_id}: {e}")
        return []

def create_turn(name, run_id, athlete_id, event_id, latitude=None, longitude=None):
    """Creates a new turn, optionally with geographic coordinates."""
    url = f"{BASE_URL}/turns"
    payload = {
        "turn_name": name,
        "run_id": run_id,
        "athlete_id": athlete_id,
        "event_id": event_id,
        "latitude": latitude,
        "longitude": longitude
    }
    # Filter out null values so the API doesn't receive them if they are not provided
    payload = {k: v for k, v in payload.items() if v is not None}
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        if latitude is not None and longitude is not None:
            print(f"Turn '{name}' for run {run_id} at ({latitude}, {longitude}) created successfully.")
        else:
            print(f"Turn '{name}' for run {run_id} created successfully.")
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error creating turn '{name}': {e}")
        if e.response:
            print(f"Response: {e.response.json()}")
        return None


def get_turns_for_run(run_id):
    """Gets all turns for a given run."""
    url = f"{BASE_URL}/runs/{run_id}/turns"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json().get('turns', [])
    except requests.exceptions.RequestException as e:
        print(f"Error getting turns for run {run_id}: {e}")
        return []

def upload_video_for_turn(turn_id, video_path):
    """Uploads a video for a specific turn."""
    url = f"{BASE_URL}/turns/{turn_id}/upload"
    try:
        with open(video_path, 'rb') as f:
            files = {'video': (os.path.basename(video_path), f, 'video/mp4')}
            response = requests.post(url, files=files)
            response.raise_for_status()
            print(f"Video '{os.path.basename(video_path)}' uploaded for turn {turn_id}.")
            return response.json()
    except FileNotFoundError:
        print(f"Error: Video file not found at {video_path}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error uploading video for turn {turn_id}: {e}")
        if e.response:
            print(f"Response: {e.response.json()}")
        return None

def get_random_video(directory):
    """Gets a random video from the specified directory."""
    try:
        videos = [f for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
        if not videos:
            print(f"No videos found in directory '{directory}'.")
            return None
        return os.path.join(directory, random.choice(videos))
    except FileNotFoundError:
        print(f"Error: Directory '{directory}' not found.")
        return None

def main():
    """Main function to iterate through the SAMPLES map and seed the database."""
    print("--- Starting Database Seed ---")
    
    jackson_hole_trails = list(SKI_TRAILS["Jackson Hole"].keys())

    for athlete_data in SAMPLES:
        # 1. Create the Athlete
        athlete_name = athlete_data["athlete_name"]
        athlete_discipline = athlete_data["discipline"]
        create_athlete(athlete_name)
        all_athletes = get_athletes()
        if not all_athletes:
            print(f"Could not retrieve athletes after creating {athlete_name}. Skipping.")
            continue
        athlete = all_athletes[-1]
        athlete_id = athlete['athlete_id']
        print(f"--- Processing for Athlete: {athlete_name} (ID: {athlete_id}), Discipline: {athlete_discipline} ---")

        for event_data in athlete_data["events"]:
            # 2. Create the Event
            event_name = event_data["event_name"]
            create_event(event_name)
            all_events = get_events()
            if not all_events:
                print(f"Could not retrieve events after creating {event_name}. Skipping.")
                continue
            event = all_events[-1]
            event_id = event['event_id']
            print(f"--- Processing for Event: {event_name} (ID: {event_id}) ---")

            for run_data in event_data["runs"]:
                # 3. Create the Run
                run_name = run_data["run_name"]
                create_run(run_name, event_id, athlete_id)
                runs_for_event = get_runs_for_event(event_id)
                if not runs_for_event:
                    print(f"Could not retrieve runs after creating {run_name}. Skipping.")
                    continue
                run = runs_for_event[-1]
                run_id = run['run_id']
                print(f"--- Processing for Run: {run_name} (ID: {run_id}) ---")

                # 4. Determine which turns to create
                turns_to_create = []
                if athlete_discipline == "Snowboarding":
                    random_trail_name = random.choice(jackson_hole_trails)
                    print(f"Selected ski trail for run: {random_trail_name}")
                    trail_points = SKI_TRAILS["Jackson Hole"][random_trail_name]
                    for point in trail_points:
                        turn_name = f"{random_trail_name} - {point['name']}"
                        turns_to_create.append({"name": turn_name, "lat": point['lat'], "lon": point['lon']})
                else:
                    for turn_name in run_data.get("turns", []):
                        turns_to_create.append({"name": turn_name, "lat": None, "lon": None})

                for turn_info in turns_to_create:
                    # 5. Create the Turn with its coordinates
                    create_turn(
                        turn_info["name"], 
                        run_id, 
                        athlete_id, 
                        event_id, 
                        latitude=turn_info["lat"], 
                        longitude=turn_info["lon"]
                    )
                    turns_for_run = get_turns_for_run(run_id)
                    if not turns_for_run:
                        print(f"Could not retrieve turns for run {run_id}. Cannot upload video.")
                        continue
                    turn = turns_for_run[-1]
                    turn_id = turn['turn_id']

                    # 6. Upload a random video for the new turn
                    video_path = get_random_video(VIDEO_DIRECTORY)
                    if video_path:
                        upload_video_for_turn(turn_id, video_path)
                    else:
                        print("No video found to upload.")
                print("-" * 20)
        print("=" * 40 + "\n")

    print("\n--- Database Seed Finished ---")

if __name__ == "__main__":
    main()