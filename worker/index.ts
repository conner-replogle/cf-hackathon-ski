import { Hono } from "hono";

type Bindings = {
  DB: D1Database;
  VIDEOS: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

// 500 middleware
app.onError((err, c) => {
  if (
    err instanceof Error &&
    err.message.includes("UNIQUE constraint failed")
  ) {
    return c.json(
      { error: "A resource with the provided details already exists." },
      409
    );
  }
  return c.json(
    {
      error: "Internal Server Error",
      message: err instanceof Error ? err.message : "An unknown error occurred",
    },
    500
  );
});

//#region Admin Page Create
app.post("/events", async (c) => {
  const { event_name, event_location } = await c.req.json<{
    event_name: string;
    event_location: string;
  }>();

  // Validate
  if (!event_name || !event_location) {
    return c.json({ error: "Event name and location are required" }, 400);
  }

  // Insert
  const stmt = c.env.DB.prepare(
    "INSERT INTO Events (event_name, event_location) VALUES (?, ?) RETURNING *"
  );
  let ret = await stmt.bind(event_name, event_location).first();

  console.log(ret);

  return c.json(ret, 201);
});

app.post("/events/:id/athletes", async (c) => {
  const eventId = c.req.param("id");
  const { athletes } = await c.req.json<{ athletes: string[] }>();

  // Validate
  {
    if (!athletes || !Array.isArray(athletes) || athletes.length === 0) {
      return c.json(
        { error: "Athletes array is required and cannot be empty" },
        400
      );
    }

    const event = await c.env.DB.prepare("SELECT id FROM Events WHERE id = ?")
      .bind(eventId)
      .first();
    if (!event) {
      return c.json({ error: "Event not found" }, 400);
    }
  }

  // Insert
  const stmt = c.env.DB.prepare(
    "INSERT INTO Athletes (event_id, athlete_name) VALUES (?, ?) RETURNING *"
  );
  const statements = athletes.map((name) => stmt.bind(eventId, name));
  let ret = await c.env.DB.batch(statements);

  return c.json(ret, 201);
});

type Turn = {
  turn_name: string;
  latitude: number;
  longitude: number;
};

app.post("/events/:id/routes", async (c) => {
  const eventId = c.req.param("id");
  const { route_name, turns } = await c.req.json<{
    route_name: string;
    turns: Turn[];
  }>();

  // Validate
  {
    if (!route_name) {
      return c.json({ error: "Route name is required" }, 400);
    }
    if (!turns || !Array.isArray(turns) || turns.length === 0) {
      return c.json(
        { error: "Turns array is required and cannot be empty" },
        400
      );
    }
    const event = await c.env.DB.prepare("SELECT id FROM Events WHERE id = ?")
      .bind(eventId)
      .first();
    if (!event) {
      return c.json({ error: "Event not found" }, 404);
    }
  }

  // Insert
  let newRoute;
  let turnsResults;
  {
    const routeStmt = c.env.DB.prepare(
      "INSERT INTO Routes (event_id, route_name) VALUES (?, ?) RETURNING *"
    );
    newRoute = await routeStmt.bind(eventId, route_name).first();
    if (!newRoute) {
      return c.json({ error: "Failed to create route" }, 500);
    }

    const turnInsertStmt = c.env.DB.prepare(
      "INSERT INTO Turns (route_id, turn_order, turn_name, latitude, longitude) VALUES (?, ?, ?, ?, ?) RETURNING *"
    );
    const turnStatements = turns.map((turn, index) =>
      turnInsertStmt.bind(
        newRoute.id,
        index, // Use the array index as the turn_order
        turn.turn_name,
        turn.latitude ?? null,
        turn.longitude ?? null
      )
    );
    turnsResults = (await c.env.DB.batch(turnStatements)).flatMap(
      (t) => t.results
    );
  }

  return c.json({ route: newRoute, turns: turnsResults }, 201);
});
//#endregion Admin Page Create Event

//#region Admin Page Modify
app.put("/events/:id", async (c) => {
  const eventId = c.req.param("id");
  const { event_name, event_location } = await c.req.json<{
    event_name: string;
    event_location: string;
  }>();

  // Validate input
  if (!event_name || !event_location) {
    return c.json({ error: "Event name and location are required" }, 400);
  }

  // Update
  const stmt = c.env.DB.prepare(
    "UPDATE Events SET event_name = ?, event_location = ? WHERE id = ? RETURNING *"
  );
  const updatedEvent = await stmt
    .bind(event_name, event_location, eventId)
    .first();

  if (!updatedEvent) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.json(updatedEvent, 200);
});

app.put("/athletes/:id", async (c) => {
  const athleteId = c.req.param("id");
  const { athlete_name } = await c.req.json<{ athlete_name: string }>();

  // Validate input
  if (!athlete_name) {
    return c.json({ error: "Athlete name is required" }, 400);
  }

  // Update
  const stmt = c.env.DB.prepare(
    "UPDATE Athletes SET athlete_name = ? WHERE id = ? RETURNING *"
  );
  const updatedAthlete = await stmt.bind(athlete_name, athleteId).first();

  if (!updatedAthlete) {
    return c.json({ error: "Athlete not found" }, 404);
  }
  return c.json(updatedAthlete, 200);
});

app.put("/routes/:id", async (c) => {
  const routeId = c.req.param("id");
  const { route_name } = await c.req.json<{ route_name: string }>();

  // Validate input
  if (!route_name) {
    return c.json({ error: "Route name is required" }, 400);
  }

  // Update
  const stmt = c.env.DB.prepare(
    "UPDATE Routes SET route_name = ? WHERE id = ? RETURNING *"
  );
  const updatedRoute = await stmt.bind(route_name, routeId).first();

  if (!updatedRoute) {
    return c.json({ error: "Route not found" }, 404);
  }
  return c.json(updatedRoute, 200);
});

app.put("/turns/:id", async (c) => {
  const turnId = c.req.param("id");
  const { turn_name, turn_order, latitude, longitude } = await c.req.json<{
    turn_name?: string;
    turn_order?: number;
    latitude?: number;
    longitude?: number;
  }>();

  const updateFields: string[] = [];
  const bindings: (string | number)[] = [];

  if (turn_name !== undefined) {
    updateFields.push("turn_name = ?");
    bindings.push(turn_name);
  }
  if (turn_order !== undefined) {
    updateFields.push("turn_order = ?");
    bindings.push(turn_order);
  }
  if (latitude !== undefined) {
    updateFields.push("latitude = ?");
    bindings.push(latitude);
  }
  if (longitude !== undefined) {
    updateFields.push("longitude = ?");
    bindings.push(longitude);
  }

  // Validate that at least one field to update was provided.
  if (updateFields.length === 0) {
    return c.json(
      {
        error:
          "At least one field to update is required: turn_name, turn_order, latitude, or longitude.",
      },
      400
    );
  }
  bindings.push(turnId);

  // Update
  const sql = `UPDATE Turns SET ${updateFields.join(
    ", "
  )} WHERE id = ? RETURNING *`;
  const stmt = c.env.DB.prepare(sql);
  const updatedTurn = await stmt.bind(...bindings).first();

  if (!updatedTurn) {
    return c.json({ error: "Turn not found" }, 404);
  }
  return c.json(updatedTurn, 200);
});
//#endregion Admin Page Modify

//#region Admin Page Delete
app.delete("/events/:id", async (c) => {
  const eventId = c.req.param("id");
  const stmt = c.env.DB.prepare("DELETE FROM Events WHERE id = ?");
  const { meta } = await stmt.bind(eventId).run();

  if (meta.changes === 0) {
    return c.json({ error: "Event not found" }, 404);
  }

  return c.body(null, 204);
});

app.delete("/athletes/:id", async (c) => {
  const athleteId = c.req.param("id");
  const stmt = c.env.DB.prepare("DELETE FROM Athletes WHERE id = ?");
  const { meta } = await stmt.bind(athleteId).run();

  if (meta.changes === 0) {
    return c.json({ error: "Athlete not found" }, 404);
  }

  return c.body(null, 204);
});

app.delete("/routes/:id", async (c) => {
  const routeId = c.req.param("id");
  const stmt = c.env.DB.prepare("DELETE FROM Routes WHERE id = ?");
  const { meta } = await stmt.bind(routeId).run();

  if (meta.changes === 0) {
    return c.json({ error: "Route not found" }, 404);
  }

  return c.body(null, 204);
});

app.delete("/turns/:id", async (c) => {
  const turnId = c.req.param("id");
  const stmt = c.env.DB.prepare("DELETE FROM Turns WHERE id = ?");
  const { meta } = await stmt.bind(turnId).run();

  if (meta.changes === 0) {
    return c.json({ error: "Turn not found" }, 404);
  }

  return c.body(null, 204);
});
//#endregion Admin Page Delete
