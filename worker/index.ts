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

//#region Admin Page Create Event
// Create Event
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

// Create Athletes
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
  latitude?: number;
  longitude?: number;
};

// Create routes + turns
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
