CREATE TABLE Events (
    id INTEGER PRIMARY KEY,
    event_name TEXT NOT NULL UNIQUE,
    event_location TEXT NOT NULL
);

CREATE TABLE Athletes (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    athlete_name TEXT NOT NULL,
    FOREIGN KEY (event_id) references Events(id)
);

CREATE TABLE Routes (
    id INTEGER PRIMARY KEY,
    event_id INTEGER NOT NULL,
    route_name TEXT NOT NULL UNIQUE,
    FOREIGN KEY (event_id) references Events(id)
);

CREATE TABLE Turns (
    id INTEGER PRIMARY KEY,
    route_id INTEGER NOT NULL,
    turn_order INTEGER NOT NULL,
    turn_name TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    UNIQUE(route_id, turn_order, turn_name),
    FOREIGN KEY (route_id) references Routes(id)
);

CREATE TABLE Runs (
    id INTEGER PRIMARY KEY,
    route_id INTEGER NOT NULL,
    athlete_id INTEGER NOT NULL,
    run_order INTEGER NOT NULL,
    FOREIGN KEY (athlete_id) references Athletes(id),
    UNIQUE (route_id, athlete_id, run_order),
    FOREIGN KEY (route_id) references Routes(id)
);

CREATE TABLE Clips (
    turn_id INTEGER,
    run_id INTEGER, 
    clip_r2 TEXT,
    FOREIGN KEY (turn_id) references Turns(id),
    FOREIGN KEY (run_id) references Runs(id),
    PRIMARY KEY (turn_id, run_id)
);