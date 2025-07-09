import requests
import os
import random

# --- Configuration ---
BASE_URL = "http://localhost:5173/api"
VIDEO_DIRECTORY = "videos"

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
    """Main function to run the seeding process."""
    print("--- Starting Database Seed ---")

    # 1. Create an Athlete
    create_athlete("John Doe")
    athletes = get_athletes()
    if not athletes:
        print("Could not retrieve athletes. Aborting.")
        return
    athlete = athletes[-1] # Get the most recently created athlete
    athlete_id = athlete['athlete_id']
    print(f"Using athlete ID: {athlete_id}")

    # 2. Create an Event
    create_event("Summer Jam 2025")
    events = get_events()
    if not events:
        print("Could not retrieve events. Aborting.")
        return
    event = events[-1] # Get the most recently created event
    event_id = event['event_id']
    print(f"Using event ID: {event_id}")

    # 3. Create a Run for the Athlete in the Event
    create_run("Final Run", event_id, athlete_id)
    runs = get_runs_for_event(event_id)
    if not runs:
        print("Could not retrieve runs. Aborting.")
        return
    run = runs[-1] # Get the most recently created run
    run_id = run['run_id']
    print(f"Using run ID: {run_id}")

    # 4. Create several Turns for the Run and upload a video for each
    for i in range(1, 4): # Create 3 turns
        turn_name = f"Turn {i}"
        create_turn(turn_name, run_id, athlete_id, event_id)
        
        # 5. Get the created turn to obtain its ID
        turns = get_turns_for_run(run_id)
        if not turns:
            print(f"Could not retrieve turns for run {run_id}. Cannot upload video.")
            continue
        
        created_turn = turns[-1] # Get the last created turn
        turn_id = created_turn['turn_id']

        # 6. Upload a random video for the new turn
        video_path = get_random_video(VIDEO_DIRECTORY)
        if video_path:
            upload_video_for_turn(turn_id, video_path)

    print("\n--- Database Seed Finished ---")


if __name__ == "__main__":
    main()