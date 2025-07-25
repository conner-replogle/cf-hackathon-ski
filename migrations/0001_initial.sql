CREATE TABLE Events (
    id INTEGER PRIMARY KEY,
    event_name TEXT NOT NULL UNIQUE,
    event_location TEXT NOT NULL,
    event_date DATE TEXT NOT NULL
);

CREATE TABLE Athletes (
    id INTEGER PRIMARY KEY,
    athlete_name TEXT NOT NULL
);

CREATE TABLE Events_Athletes(
    athlete_id INTEGER,
    event_id INTEGER,
    PRIMARY KEY (athlete_id, event_id),
    FOREIGN KEY (athlete_id) REFERENCES Athletes(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
);

CREATE TABLE Routes (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    route_name TEXT NOT NULL,
    UNIQUE(route_name, event_id),
    FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
);

CREATE TABLE Turns (
    id INTEGER PRIMARY KEY,
    route_id INTEGER NOT NULL,
    turn_order INTEGER NOT NULL,
    turn_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    UNIQUE(route_id, turn_order, turn_name),
    FOREIGN KEY (route_id) REFERENCES Routes(id) ON DELETE CASCADE
);

CREATE TABLE Runs (
    id INTEGER PRIMARY KEY,
    route_id INTEGER NOT NULL,
    athlete_id INTEGER NOT NULL,
    run_order INTEGER NOT NULL,
    FOREIGN KEY (athlete_id) REFERENCES Athletes(id) ON DELETE CASCADE,
    UNIQUE (route_id, athlete_id, run_order),
    FOREIGN KEY (route_id) REFERENCES Routes(id) ON DELETE CASCADE
);

CREATE TABLE Clips (
    turn_id INTEGER,
    run_id INTEGER, 
    clip_r2 TEXT,
    FOREIGN KEY (turn_id) REFERENCES Turns(id) ON DELETE CASCADE,
    FOREIGN KEY (run_id) REFERENCES Runs(id) ON DELETE CASCADE,
    PRIMARY KEY (turn_id, run_id)
);
