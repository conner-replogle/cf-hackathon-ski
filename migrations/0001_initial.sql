-- Migration number: 0001 	 2025-07-09T17:25:10.801Z
CREATE TABLE Athletes (
    athlete_id INTEGER PRIMARY KEY,
    athlete_name TEXT NOT NULL UNIQUE
);

CREATE TABLE Event (
    event_id INTEGER PRIMARY KEY,
    event_name TEXT NOT NULL UNIQUE
);

CREATE TABLE Run (
    run_id INTEGER PRIMARY KEY,
    run_name TEXT NOT NULL UNIQUE,
    event_id INTEGER,
    athlete_id INTEGER,
    FOREIGN KEY (event_id) REFERENCES Event(event_id),
    FOREIGN KEY (athlete_id) REFERENCES Athletes(athlete_id)
);

CREATE TABLE Turns (
    turn_id INTEGER PRIMARY KEY,
    run_id INTEGER,
    turn_name TEXT NOT NULL UNIQUE,
    event_id INTEGER,
    athlete_id INTEGER,
    r2_video_link TEXT,
    latitude REAL,
    longitude REAL,
    FOREIGN KEY (event_id) REFERENCES Event(event_id),
    FOREIGN KEY (athlete_id) REFERENCES Athletes(athlete_id),
    FOREIGN KEY (run_id) REFERENCES Run(run_id)
);