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

//#region Global Views
app.get("/events", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM Events").all();
  return c.json(results);
});

app.get("/events/:id", async (c) => {
  const eventId = c.req.param("id");

  const eventPromise = c.env.DB.prepare("SELECT * FROM Events WHERE id = ?")
    .bind(eventId)
    .first();

  const athletesPromise = c.env.DB.prepare(
    "SELECT * FROM Athletes WHERE event_id = ?"
  )
    .bind(eventId)
    .all();

  const routesPromise = c.env.DB.prepare(
    "SELECT * FROM Routes WHERE event_id = ?"
  )
    .bind(eventId)
    .all();

  const [event, athletesResult, routesResult] = await Promise.all([
    eventPromise,
    athletesPromise,
    routesPromise,
  ]);

  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }

  return c.json({
    ...event,
    athletes: athletesResult.results,
    routes: routesResult.results,
  });
});

app.get("/athletes/:id", async (c) => {
  const athleteId = c.req.param("id");
  const athlete = await c.env.DB.prepare("SELECT * FROM Athletes WHERE id = ?")
    .bind(athleteId)
    .first();

  if (!athlete) {
    return c.json({ error: "Athlete not found" }, 404);
  }
  return c.json(athlete);
});

app.get("/routes/:id", async (c) => {
  const routeId = c.req.param("id");

  const routePromise = c.env.DB.prepare("SELECT * FROM Routes WHERE id = ?")
    .bind(routeId)
    .first();

  const turnsPromise = c.env.DB.prepare(
    "SELECT * FROM Turns WHERE route_id = ? ORDER BY turn_order"
  )
    .bind(routeId)
    .all();

  const [route, turnsResult] = await Promise.all([routePromise, turnsPromise]);

  if (!route) {
    return c.json({ error: "Route not found" }, 404);
  }

  return c.json({
    ...route,
    turns: turnsResult.results,
  });
});

app.get("/turns/:id", async (c) => {
  const turnId = c.req.param("id");
  const turn = await c.env.DB.prepare("SELECT * FROM Turns WHERE id = ?")
    .bind(turnId)
    .first();
  if (!turn) {
    return c.json({ error: "Turn not found" }, 404);
  }
  return c.json(turn);
});

app.get("/runs/:id", async (c) => {
  const runId = c.req.param("id");
  const run = await c.env.DB.prepare("SELECT * FROM Runs WHERE id = ?")
    .bind(runId)
    .first();
  if (!run) {
    return c.json({ error: "Run not found" }, 404);
  }
  return c.json(run);
});

app.get("/runs/:runId/turns/:turnId/clips", async (c) => {
  const { runId, turnId } = c.req.param();

  const clip = await c.env.DB.prepare(
    "SELECT clip_r2 FROM Clips WHERE run_id = ? AND turn_id = ?"
  )
    .bind(runId, turnId)
    .first<{ clip_r2: string }>();

  if (!clip || !clip.clip_r2) {
    return c.json({ error: "Clip not found" }, 404);
  }

  const r2Object = await c.env.VIDEOS.get(clip.clip_r2);

  if (r2Object === null) {
    return c.json({ error: "Clip file not found in storage" }, 404);
  }

  c.header("Content-Type", r2Object.httpMetadata?.contentType);
  c.header("Content-Length", r2Object.size.toString());

  return c.body(r2Object.body);
});
//#endregion Global Views

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
        turn.latitude,
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

//#region Video Page Create
app.post("/runs", async (c) => {
  const { route_id, athlete_id, run_order } = await c.req.json<{
    route_id: number;
    athlete_id: number;
    run_order: number;
  }>();

  // Validate input
  {
    if (
      route_id === undefined ||
      athlete_id === undefined ||
      run_order === undefined
    ) {
      return c.json(
        { error: "route_id, athlete_id, and run_order are required" },
        400
      );
    }

    const route = await c.env.DB.prepare("SELECT id FROM Routes WHERE id = ?")
      .bind(route_id)
      .first();
    if (!route) {
      return c.json({ error: "Route not found" }, 404);
    }
    const athlete = await c.env.DB.prepare(
      "SELECT id FROM Athletes WHERE id = ?"
    )
      .bind(athlete_id)
      .first();
    if (!athlete) {
      return c.json({ error: "Athlete not found" }, 404);
    }
  }

  // Insert
  const stmt = c.env.DB.prepare(
    "INSERT INTO Runs (route_id, athlete_id, run_order) VALUES (?, ?, ?) RETURNING *"
  );
  const newRun = await stmt.bind(route_id, athlete_id, run_order).first();

  return c.json(newRun, 201);
});

app.post("/runs/:runId/turns/:turnId/clips", async (c) => {
  const { runId, turnId } = c.req.param();
  const formData = await c.req.formData();
  const videoFile = formData.get("video");

  // Validate
  {
    if (!videoFile || !(videoFile instanceof File)) {
      return c.json(
        { error: "A 'video' file is required in the form data" },
        400
      );
    }

    const run = await c.env.DB.prepare("SELECT id FROM Runs WHERE id = ?")
      .bind(runId)
      .first();
    if (!run) {
      return c.json({ error: "Run not found" }, 404);
    }
    const turn = await c.env.DB.prepare("SELECT id FROM Turns WHERE id = ?")
      .bind(turnId)
      .first();
    if (!turn) {
      return c.json({ error: "Turn not found" }, 404);
    }
  }

  // Upload
  const r2Key = `runs/${runId}/turns/${turnId}.mp4`;
  await c.env.VIDEOS.put(r2Key, videoFile.stream(), {
    httpMetadata: { contentType: videoFile.type },
  });

  // Insert
  const stmt = c.env.DB.prepare(
    "INSERT OR REPLACE INTO Clips (run_id, turn_id, clip_r2) VALUES (?, ?, ?) RETURNING *"
  );
  const newClip = await stmt.bind(runId, turnId, r2Key).first();

  return c.json(newClip, 201);
});
//#endregion Video Page Create

//#region Video Page Delete
app.delete("/runs/:runId/turns/:turnId/clips", async (c) => {
  const { runId, turnId } = c.req.param();

  // Delete from R2
  {
    const clip = await c.env.DB.prepare(
      "SELECT clip_r2 FROM Clips WHERE run_id = ? AND turn_id = ?"
    )
      .bind(runId, turnId)
      .first<{ clip_r2: string }>();
    if (clip && clip.clip_r2) {
      await c.env.VIDEOS.delete(clip.clip_r2);
    }
  }

  // Delete from D1
  {
    const { meta } = await c.env.DB.prepare(
      "DELETE FROM Clips WHERE run_id = ? AND turn_id = ?"
    )
      .bind(runId, turnId)
      .run();
    if (meta.changes === 0) {
      return c.json({ error: "Clip not found" }, 404);
    }
  }

  return c.body(null, 204);
});

app.delete("/runs/:id", async (c) => {
  const runId = c.req.param("id");

  // Delete from R2
  {
    const { results } = await c.env.DB.prepare(
      "SELECT clip_r2 FROM Clips WHERE run_id = ?"
    )
      .bind(runId)
      .all<{ clip_r2: string }>();

    if (results && results.length > 0) {
      const keys = results.map((r) => r.clip_r2).filter(Boolean); // Filter out any null/empty keys
      if (keys.length > 0) {
        await c.env.VIDEOS.delete(keys);
      }
    }
  }

  // Delete from D1
  {
    const { meta } = await c.env.DB.prepare("DELETE FROM Runs WHERE id = ?")
      .bind(runId)
      .run();
    if (meta.changes === 0) {
      return c.json({ error: "Run not found" }, 404);
    }
  }

  return c.body(null, 204);
});
//#endregion Video Page Delete
