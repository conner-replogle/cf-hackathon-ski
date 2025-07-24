import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import type { Event, Athlete, Route, EventWithRelations } from "./types";

type Bindings = {
  DB: D1Database;
  VIDEOS: R2Bucket;
};

const TurnSchema = z.object({
  turn_name: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

// Events
const eventsApp = new Hono<{ Bindings: Bindings }>()
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM Events").all();
    const events = results as unknown as Event[];
    return c.json(events, 200);
  })
  .get("/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
    const { id: eventId } = c.req.valid("param");
    const eventPromise = c.env.DB.prepare("SELECT * FROM Events WHERE id = ?")
      .bind(eventId)
      .first();
    const athletesPromise = c.env.DB.prepare(
      "SELECT * FROM Athletes WHERE event_id = ?",
    )
      .bind(eventId)
      .all();
    const routesPromise = c.env.DB.prepare(
      "SELECT * FROM Routes WHERE event_id = ?",
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
    const eventWithRelations: EventWithRelations = {
      ...(event as unknown as Event),
      athletes: athletesResult.results as unknown as Athlete[],
      routes: routesResult.results as unknown as Route[],
    };
    return c.json(eventWithRelations, 200);
  })

  .post(
    "/",
    zValidator(
      "json",
      z.object({
        event_name: z.string().min(1),
        event_location: z.string().min(1),
      }),
    ),
    async (c) => {
      const { event_name, event_location } = c.req.valid("json");
      const stmt = c.env.DB.prepare(
        "INSERT INTO Events (event_name, event_location) VALUES (?, ?) RETURNING *",
      );
      const newEvent = await stmt.bind(event_name, event_location).first();
      return c.json(newEvent as unknown as Event, 201);
    },
  )
  .post(
    "/:id/athletes",
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      z.object({ athletes: z.array(z.string().min(1)).min(1) }),
    ),
    async (c) => {
      const { id: eventId } = c.req.valid("param");
      const { athletes } = c.req.valid("json");
      const event = await c.env.DB.prepare("SELECT id FROM Events WHERE id = ?")
        .bind(eventId)
        .first();
      if (!event) {
        return c.json({ error: "Event not found" }, 400);
      }
      const stmt = c.env.DB.prepare(
        "INSERT INTO Athletes (event_id, athlete_name) VALUES (?, ?) RETURNING *",
      );
      const statements = athletes.map((name) => stmt.bind(eventId, name));
      const results = await c.env.DB.batch(statements);
      const createdAthletes = results
        .map((result) => result.results?.[0] as unknown as Athlete)
        .filter(Boolean);
      return c.json(createdAthletes, 201);
    },
  )
  .post(
    "/:id/routes",
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      z.object({
        route_name: z.string().min(1),
        turns: z.array(TurnSchema).min(1),
      }),
    ),
    async (c) => {
      const { id: eventId } = c.req.valid("param");
      const { route_name, turns } = c.req.valid("json");
      const event = await c.env.DB.prepare("SELECT id FROM Events WHERE id = ?")
        .bind(eventId)
        .first();
      if (!event) {
        return c.json({ error: "Event not found" }, 404);
      }
      const routeStmt = c.env.DB.prepare(
        "INSERT INTO Routes (event_id, route_name) VALUES (?, ?) RETURNING *",
      );
      const newRoute = await routeStmt.bind(eventId, route_name).first();
      if (!newRoute) {
        return c.json({ error: "Failed to create route" }, 500);
      }
      const turnInsertStmt = c.env.DB.prepare(
        "INSERT INTO Turns (route_id, turn_order, turn_name, latitude, longitude) VALUES (?, ?, ?, ?, ?) RETURNING *",
      );
      const turnStatements = turns.map((turn, index) =>
        turnInsertStmt.bind(
          newRoute.id,
          index,
          turn.turn_name,
          turn.latitude,
          turn.longitude,
        ),
      );
      const turnsResults = (await c.env.DB.batch(turnStatements)).flatMap(
        (t) => t.results,
      );
      return c.json({ route: newRoute, turns: turnsResults }, 201);
    },
  )
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      z.object({
        event_name: z.string().min(1),
        event_location: z.string().min(1),
      }),
    ),
    async (c) => {
      const { id: eventId } = c.req.valid("param");
      const { event_name, event_location } = c.req.valid("json");
      const stmt = c.env.DB.prepare(
        "UPDATE Events SET event_name = ?, event_location = ? WHERE id = ? RETURNING *",
      );
      const updatedEvent = await stmt
        .bind(event_name, event_location, eventId)
        .first();
      if (!updatedEvent) {
        return c.json({ error: "Event not found" }, 404);
      }
      return c.json(updatedEvent, 200);
    },
  )
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id: eventId } = c.req.valid("param");
      const stmt = c.env.DB.prepare("DELETE FROM Events WHERE id = ?");
      const { meta } = await stmt.bind(eventId).run();
      if (meta.changes === 0) {
        return c.json({ error: "Event not found" }, 404);
      }
      return c.body(null, 204);
    },
  );

// Athletes
const athletesApp = new Hono<{ Bindings: Bindings }>()
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM Athletes").all();
    return c.json(results as unknown as Athlete[], 200);
  })
  .get("/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
    const { id: athleteId } = c.req.valid("param");
    const athlete = await c.env.DB.prepare(
      "SELECT * FROM Athletes WHERE id = ?",
    )
      .bind(athleteId)
      .first();
    if (!athlete) {
      return c.json({ error: "Athlete not found" }, 404);
    }
    return c.json(athlete as unknown as Athlete, 200);
  })
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    zValidator("json", z.object({ athlete_name: z.string().min(1) })),
    async (c) => {
      const { id: athleteId } = c.req.valid("param");
      const { athlete_name } = c.req.valid("json");
      const stmt = c.env.DB.prepare(
        "UPDATE Athletes SET athlete_name = ? WHERE id = ? RETURNING *",
      );
      const updatedAthlete = await stmt.bind(athlete_name, athleteId).first();
      if (!updatedAthlete) {
        return c.json({ error: "Athlete not found" }, 404);
      }
      return c.json(updatedAthlete, 200);
    },
  )
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id: athleteId } = c.req.valid("param");
      const stmt = c.env.DB.prepare("DELETE FROM Athletes WHERE id = ?");
      const { meta } = await stmt.bind(athleteId).run();
      if (meta.changes === 0) {
        return c.json({ error: "Athlete not found" }, 404);
      }
      return c.body(null, 204);
    },
  );

// Routes
const routesApp = new Hono<{ Bindings: Bindings }>()
  .get(
    "/",
    zValidator("query", z.object({ event_id: z.string().optional() })),
    async (c) => {
      const { event_id } = c.req.valid("query");
      if (event_id) {
        const { results } = await c.env.DB.prepare(
          "SELECT * FROM Routes WHERE event_id = ?",
        )
          .bind(event_id)
          .all();
        return c.json(results, 200);
      }
      const { results } = await c.env.DB.prepare("SELECT * FROM Routes").all();
      const routes = results as unknown as Route[];
      return c.json(routes, 200);
    },
  )
  .get("/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
    const { id: routeId } = c.req.valid("param");
    const routePromise = c.env.DB.prepare("SELECT * FROM Routes WHERE id = ?")
      .bind(routeId)
      .first();
    const turnsPromise = c.env.DB.prepare(
      "SELECT * FROM Turns WHERE route_id = ? ORDER BY turn_order",
    )
      .bind(routeId)
      .all();
    const [route, turnsResult] = await Promise.all([
      routePromise,
      turnsPromise,
    ]);
    if (!route) {
      return c.json({ error: "Route not found" }, 404);
    }
    return c.json(
      {
        ...route,
        turns: turnsResult.results,
      },
      200,
    );
  })
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    zValidator("json", z.object({ route_name: z.string().min(1) })),
    async (c) => {
      const { id: routeId } = c.req.valid("param");
      const { route_name } = c.req.valid("json");
      const stmt = c.env.DB.prepare(
        "UPDATE Routes SET route_name = ? WHERE id = ? RETURNING *",
      );
      const updatedRoute = await stmt.bind(route_name, routeId).first();
      if (!updatedRoute) {
        return c.json({ error: "Route not found" }, 404);
      }
      return c.json(updatedRoute, 200);
    },
  )
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id: routeId } = c.req.valid("param");
      const stmt = c.env.DB.prepare("DELETE FROM Routes WHERE id = ?");
      const { meta } = await stmt.bind(routeId).run();
      if (meta.changes === 0) {
        return c.json({ error: "Route not found" }, 404);
      }
      return c.body(null, 204);
    },
  );

// Turns
const turnsApp = new Hono<{ Bindings: Bindings }>()
  .get(
    "/",
    zValidator("query", z.object({ route_id: z.string().optional() })),
    async (c) => {
      const { route_id } = c.req.valid("query");
      if (route_id) {
        const { results } = await c.env.DB.prepare(
          "SELECT * FROM Turns WHERE route_id = ?",
        )
          .bind(route_id)
          .all();
        return c.json(results, 200);
      }
      const { results } = await c.env.DB.prepare("SELECT * FROM Turns").all();
      return c.json(results, 200);
    },
  )
  .get("/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
    const { id: turnId } = c.req.valid("param");
    const turn = await c.env.DB.prepare("SELECT * FROM Turns WHERE id = ?")
      .bind(turnId)
      .first();
    if (!turn) {
      return c.json({ error: "Turn not found" }, 404);
    }
    return c.json(turn, 200);
  })
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    zValidator(
      "json",
      z
        .object({
          turn_name: z.string().optional(),
          turn_order: z.number().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        })
        .refine(
          (data) => Object.keys(data).length > 0,
          "At least one field to update is required.",
        ),
    ),
    async (c) => {
      const { id: turnId } = c.req.valid("param");
      const validData = c.req.valid("json");
      const updateFields = Object.keys(validData);
      const bindings = [...Object.values(validData), turnId];
      const sql = `UPDATE Turns SET ${updateFields
        .map((field) => `${field} = ?`)
        .join(", ")} WHERE id = ? RETURNING *`;
      const stmt = c.env.DB.prepare(sql);
      const updatedTurn = await stmt.bind(...bindings).first();
      if (!updatedTurn) {
        return c.json({ error: "Turn not found" }, 404);
      }
      return c.json(updatedTurn, 200);
    },
  )
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id: turnId } = c.req.valid("param");
      const stmt = c.env.DB.prepare("DELETE FROM Turns WHERE id = ?");
      const { meta } = await stmt.bind(turnId).run();
      if (meta.changes === 0) {
        return c.json({ error: "Turn not found" }, 404);
      }
      return c.body(null, 204);
    },
  );

// Runs & Clips
const runsApp = new Hono<{ Bindings: Bindings }>()
  .get("/", async (c) => {
    const { results } = await c.env.DB.prepare("SELECT * FROM Runs").all();
    return c.json(results, 200);
  })
  .get(
    "/event/:eventId",
    zValidator("param", z.object({ eventId: z.string() })),
    async (c) => {
      const { eventId } = c.req.valid("param");

      // First verify the event exists
      const event = await c.env.DB.prepare("SELECT id FROM Events WHERE id = ?")
        .bind(eventId)
        .first();
      if (!event) {
        return c.json({ error: "Event not found" }, 404);
      }

      // Get runs for the event through routes
      const { results } = await c.env.DB.prepare(
        `
      SELECT r.*, rt.route_name, a.athlete_name 
      FROM Runs r
      JOIN Routes rt ON r.route_id = rt.id
      JOIN Athletes a ON r.athlete_id = a.id
      WHERE rt.event_id = ?
      ORDER BY r.run_order
    `,
      )
        .bind(eventId)
        .all();

      return c.json(results, 200);
    },
  )
  .get("/:id", zValidator("param", z.object({ id: z.string() })), async (c) => {
    const { id: runId } = c.req.valid("param");
    const run = await c.env.DB.prepare("SELECT * FROM Runs WHERE id = ?")
      .bind(runId)
      .first();
    if (!run) {
      return c.json({ error: "Run not found" }, 404);
    }
    return c.json(run, 200);
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        route_id: z.number(),
        athlete_id: z.number(),
        run_order: z.number(),
      }),
    ),
    async (c) => {
      const { route_id, athlete_id, run_order } = c.req.valid("json");
      const route = await c.env.DB.prepare("SELECT id FROM Routes WHERE id = ?")
        .bind(route_id)
        .first();
      if (!route) return c.json({ error: "Route not found" }, 404);
      const athlete = await c.env.DB.prepare(
        "SELECT id FROM Athletes WHERE id = ?",
      )
        .bind(athlete_id)
        .first();
      if (!athlete) return c.json({ error: "Athlete not found" }, 404);
      const stmt = c.env.DB.prepare(
        "INSERT INTO Runs (route_id, athlete_id, run_order) VALUES (?, ?, ?) RETURNING *",
      );
      const newRun = await stmt.bind(route_id, athlete_id, run_order).first();
      return c.json(newRun, 201);
    },
  )

  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.string() })),
    async (c) => {
      const { id: runId } = c.req.valid("param");
      const { results } = await c.env.DB.prepare(
        "SELECT clip_r2 FROM Clips WHERE run_id = ?",
      )
        .bind(runId)
        .all<{ clip_r2: string }>();
      if (results?.length > 0) {
        const keys = results.map((r) => r.clip_r2).filter(Boolean);
        if (keys.length > 0) {
          await c.env.VIDEOS.delete(keys);
        }
      }
      const { meta } = await c.env.DB.prepare("DELETE FROM Runs WHERE id = ?")
        .bind(runId)
        .run();
      if (meta.changes === 0) {
        return c.json({ error: "Run not found" }, 404);
      }
      return c.body(null, 204);
    },
  )
  .get(
    "/:runId/turns/:turnId/clips",
    zValidator("param", z.object({ runId: z.string(), turnId: z.string() })),
    async (c) => {
      const { runId, turnId } = c.req.valid("param");
      const clip = await c.env.DB.prepare(
        "SELECT clip_r2 FROM Clips WHERE run_id = ? AND turn_id = ?",
      )
        .bind(runId, turnId)
        .first<{ clip_r2: string }>();
      if (!clip?.clip_r2) {
        return c.json({ error: "Clip not found" }, 404);
      }
      const r2Object = await c.env.VIDEOS.get(clip.clip_r2);
      if (r2Object === null) {
        return c.json({ error: "Clip file not found in storage" }, 404);
      }
      c.header("Content-Type", r2Object.httpMetadata?.contentType);
      c.header("Content-Length", r2Object.size.toString());
      return c.body(r2Object.body);
    },
  )
  .post(
    "/:runId/turns/:turnId/clips",
    zValidator("param", z.object({ runId: z.string(), turnId: z.string() })),
    zValidator("form", z.object({ video: z.instanceof(File) })),
    async (c) => {
      const { runId, turnId } = c.req.valid("param");
      const { video: videoFile } = c.req.valid("form");
      const run = await c.env.DB.prepare("SELECT id FROM Runs WHERE id = ?")
        .bind(runId)
        .first();
      if (!run) return c.json({ error: "Run not found" }, 404);
      const turn = await c.env.DB.prepare("SELECT id FROM Turns WHERE id = ?")
        .bind(turnId)
        .first();
      if (!turn) return c.json({ error: "Turn not found" }, 404);
      const r2Key = `runs/${runId}/turns/${turnId}.mp4`;
      await c.env.VIDEOS.put(r2Key, videoFile.stream(), {
        httpMetadata: { contentType: videoFile.type },
      });
      const stmt = c.env.DB.prepare(
        "INSERT OR REPLACE INTO Clips (run_id, turn_id, clip_r2) VALUES (?, ?, ?) RETURNING *",
      );
      const newClip = await stmt.bind(runId, turnId, r2Key).first();
      return c.json(newClip, 201);
    },
  )
  .delete(
    "/:runId/turns/:turnId/clips",
    zValidator("param", z.object({ runId: z.string(), turnId: z.string() })),
    async (c) => {
      const { runId, turnId } = c.req.valid("param");
      const clip = await c.env.DB.prepare(
        "SELECT clip_r2 FROM Clips WHERE run_id = ? AND turn_id = ?",
      )
        .bind(runId, turnId)
        .first<{ clip_r2: string }>();
      if (clip?.clip_r2) {
        await c.env.VIDEOS.delete(clip.clip_r2);
      }
      const { meta } = await c.env.DB.prepare(
        "DELETE FROM Clips WHERE run_id = ? AND turn_id = ?",
      )
        .bind(runId, turnId)
        .run();
      if (meta.changes === 0) {
        return c.json({ error: "Clip not found" }, 404);
      }
      return c.body(null, 204);
    },
  );

// --- Main App ---
const app = new Hono<{ Bindings: Bindings }>()
  .onError((err, c) => {
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      return c.json(
        { error: "A resource with the provided details already exists." },
        409,
      );
    }
    console.error(err);
    return c.json(
      {
        error: "Internal Server Error",
        message:
          err instanceof Error ? err.message : "An unknown error occurred",
      },
      500,
    );
  })
  .route("/api/events", eventsApp)
  .route("/api/athletes", athletesApp)
  .route("/api/routes", routesApp)
  .route("/api/turns", turnsApp)
  .route("/api/runs", runsApp);
/**
 * Serves a video file directly from R2.
 * @param { videoId: string }
 */
// app.get('/api/videos/:videoId', async (c) => {
//   const videoId = c.req.param('videoId');

//   try {
//     const range = c.req.header('range');
//     const videoObject = await c.env.VIDEOS.get(videoId);

//     if (videoObject === null) {
//       return c.json({ success: false, message: 'Video not found' }, 404);
//     }

//     c.header('Accept-Ranges', 'bytes');
//     c.header('Content-Type', videoObject.httpMetadata?.contentType || 'application/octet-stream');
//     c.header('ETag', videoObject.httpEtag);

//     if (range) {
//       const match = /^bytes=(\d+)-(\d*)$/.exec(range);
//       if (match) {
//         const start = parseInt(match[1], 10);
//         const end = match[2] ? parseInt(match[2], 10) : videoObject.size - 1;

//         if (start >= videoObject.size || end >= videoObject.size) {
//           return new Response('Range Not Satisfiable', {
//             status: 416,
//             headers: { 'Content-Range': `bytes */${videoObject.size}` },
//           });
//         }

//         const contentLength = end - start + 1;
//         const rangedObject = await c.env.VIDEOS.get(videoId, { range: { offset: start, length: contentLength } });

//         if (rangedObject === null) {
//           return new Response('Range Not Satisfiable', {
//             status: 416,
//             headers: { 'Content-Range': `bytes */${videoObject.size}` },
//           });
//         }

//         return new Response(rangedObject.body, {
//           status: 206,
//           headers: {
//             'Content-Range': `bytes ${start}-${end}/${videoObject.size}`,
//             'Content-Length': contentLength.toString(),
//             'Content-Type': videoObject.httpMetadata?.contentType || 'application/octet-stream',
//             'Accept-Ranges': 'bytes',
//             'ETag': videoObject.httpEtag,
//           },
//         });
//       }
//     }

//     // No range header, or invalid range, serve the full video
//     c.header('Content-Length', String(videoObject.size));
//     return c.body(videoObject.body, 200);

//   } catch (e: any) {
//     console.error('Error fetching video:', e);
//     return c.json({ success: false, message: 'An error occurred while fetching the video', error: e.message }, 500);
//   }
// });
export type AppType = typeof app;
export default app;
