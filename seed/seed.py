import requests
import os
import random

# --- Configuration ---
BASE_URL = "http://localhost:5173/api"
VIDEO_DIRECTORY = "videos"

# --- Sample Data ---
# A map of entries to seed the database with.
SAMPLES = [
    {
        "athlete_name": "Yuto Horigome",
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
        "events": [
            {
                "event_name": "Burton US Open 2025",
                "runs": [
                    {
                        "run_name": "Slopestyle Run 2",
                        "turns": ["Backside Triple Cork 1800", "Switch Backside 1620"]
                    },
                     {
                        "run_name": "Big Air Final",
                        "turns": ["Nollie Frontside 2160"]
                    }
                ]
            }
        ]
    },
    {
        "athlete_name": "Leticia Bufoni",
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
        "events": [
            {
                "event_name": "Laax Open 2025",
                "runs": [
                    {
                        "run_name": "Final Run",
                        "turns": ["Cab Double Underflip 900", "Frontside 1080", "Backside 720"]
                    }
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

def create_turn(name, run_id, athlete_id, event_id):
    """Creates a new turn."""
    url = f"{BASE_URL}/turns"
    payload = {
        "turn_name": name,
        "run_id": run_id,
        "athlete_id": athlete_id,
        "event_id": event_id
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
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

    for athlete_data in SAMPLES:
        # 1. Create the Athlete, then fetch its ID
        athlete_name = athlete_data["athlete_name"]
        create_athlete(athlete_name)
        all_athletes = get_athletes()
        if not all_athletes:
            print(f"Could not retrieve athletes after creating {athlete_name}. Skipping.")
            continue
        athlete = all_athletes[-1] # Get the most recently created athlete
        athlete_id = athlete['athlete_id']
        print(f"--- Processing for Athlete: {athlete_name} (ID: {athlete_id}) ---")

        for event_data in athlete_data["events"]:
            # 2. Create the Event, then fetch its ID
            event_name = event_data["event_name"]
            create_event(event_name)
            all_events = get_events()
            if not all_events:
                print(f"Could not retrieve events after creating {event_name}. Skipping.")
                continue
            event = all_events[-1] # Get the most recently created event
            event_id = event['event_id']
            print(f"--- Processing for Event: {event_name} (ID: {event_id}) ---")

            for run_data in event_data["runs"]:
                # 3. Create the Run, then fetch its ID
                run_name = run_data["run_name"]
                create_run(run_name, event_id, athlete_id)
                runs_for_event = get_runs_for_event(event_id)
                if not runs_for_event:
                    print(f"Could not retrieve runs after creating {run_name}. Skipping.")
                    continue
                run = runs_for_event[-1] # Get the most recently created run
                run_id = run['run_id']
                print(f"--- Processing for Run: {run_name} (ID: {run_id}) ---")

                for turn_name in run_data["turns"]:
                    # 4. Create the Turn, then fetch its ID
                    create_turn(turn_name, run_id, athlete_id, event_id)
                    turns_for_run = get_turns_for_run(run_id)
                    if not turns_for_run:
                        print(f"Could not retrieve turns for run {run_id}. Cannot upload video.")
                        continue
                    turn = turns_for_run[-1] # Get the most recently created turn
                    turn_id = turn['turn_id']

                    # 5. Upload a random video for the new turn
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