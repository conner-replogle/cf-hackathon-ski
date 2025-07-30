import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, inArray, count, and } from "drizzle-orm";
import type { Clip } from "./types";

type CfBindings = {
  DB: D1Database;
  VIDEOS: R2Bucket;
  GOOGLE_MAPS_API_KEY: string;
  CLOUDFLARE_STREAM_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
};

// #region Events
const eventsApp = new Hono<{ Bindings: CfBindings }>()
  // List Events
  .get("/", async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });
    const allEvents = await db.select().from(schema.events).all();
    return c.json(allEvents);
  })
  // Get Event
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const event = await db
        .select()
        .from(schema.events)
        .where(eq(schema.events.id, id))
        .get();
      if (!event) {
        return c.json({ error: "Event not found" }, 404);
      }
      return c.json(event);
    },
  )
  // Post Event
  .post("/", zValidator("json", schema.insertEventsSchema), async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });
    const event = c.req.valid("json");
    const [createdEvent] = await db
      .insert(schema.events)
      .values(event)
      .returning();
    if (!createdEvent) {
      return c.json({ error: "Failed to create event" }, 500);
    }
    return c.json(createdEvent, 201);
  })
  // Update Event
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator("json", schema.insertEventsSchema.partial()),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const eventUpdateData = c.req.valid("json");
      const [updatedEvent] = await db
        .update(schema.events)
        .set(eventUpdateData)
        .where(eq(schema.events.id, id))
        .returning();
      if (!updatedEvent) {
        return c.json({ error: "Event not found" }, 404);
      }
      return c.json(updatedEvent);
    },
  )
  // Delete Event
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const [deletedEvent] = await db
        .delete(schema.events)
        .where(eq(schema.events.id, id))
        .returning();
      if (!deletedEvent) {
        return c.json({ error: "Event not found" }, 404);
      }
      return c.json(deletedEvent);
    },
  )
  // Get runs for a specific event
  .get(
    "/:eventId/runs",
    zValidator("param", z.object({ eventId: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { eventId } = c.req.valid("param");

      // First, get all routes for the event
      const eventRoutes = await db
        .select({ id: schema.routes.id })
        .from(schema.routes)
        .where(eq(schema.routes.eventId, eventId));
      if (eventRoutes.length === 0) {
        return c.json([]);
      }
      const routeIds = eventRoutes.map((r) => r.id);

      // Then, get all runs for those routes and join with athletes and routes
      const runsInEvent = await db
        .select({
          run: schema.runs,
          athlete: schema.athletes,
          route: schema.routes,
        })
        .from(schema.runs)
        .where(inArray(schema.runs.routeId, routeIds))
        .leftJoin(
          schema.athletes,
          eq(schema.runs.athleteId, schema.athletes.id),
        )
        .leftJoin(schema.routes, eq(schema.runs.routeId, schema.routes.id));

      return c.json(runsInEvent);
    },
  );

// #endregion Events

// #region Athletes
const athletesApp = new Hono<{ Bindings: CfBindings }>()
  // List Athletes
  .get("/", async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });
    const allAthletes = await db.select().from(schema.athletes).all();
    return c.json(allAthletes);
  })
  // Get Athlete
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const athlete = await db
        .select()
        .from(schema.athletes)
        .where(eq(schema.athletes.id, id))
        .get();
      if (!athlete) {
        return c.json({ error: "Athlete not found" }, 404);
      }
      return c.json(athlete);
    },
  )
  // Create Athlete
  .post("/", zValidator("json", schema.insertAthletesSchema), async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });
    const athlete = c.req.valid("json");
    const [createdAthlete] = await db
      .insert(schema.athletes)
      .values(athlete)
      .returning();
    if (!createdAthlete) {
      return c.json({ error: "Failed to create athlete" }, 500);
    }
    return c.json(createdAthlete, 201);
  })
  // Update Athlete
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator("json", schema.insertAthletesSchema.partial()),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const athleteUpdateData = c.req.valid("json");
      const [updatedAthlete] = await db
        .update(schema.athletes)
        .set(athleteUpdateData)
        .where(eq(schema.athletes.id, id))
        .returning();
      if (!updatedAthlete) {
        return c.json({ error: "Athlete not found" }, 404);
      }
      return c.json(updatedAthlete);
    },
  )
  // Delete Athlete
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const [deletedAthlete] = await db
        .delete(schema.athletes)
        .where(eq(schema.athletes.id, id))
        .returning();
      if (!deletedAthlete) {
        return c.json({ error: "Athlete not found" }, 404);
      }
      return c.json(deletedAthlete);
    },
  );
// #endregion Athletes

// #region Routes
const routesApp = new Hono<{ Bindings: CfBindings }>()
  // List all routes (can be filtered by event_id)
  .get(
    "/",
    zValidator("query", z.object({ event_id: z.coerce.number().optional() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { event_id } = c.req.valid("query");

      const allRoutes = await db.query.routes.findMany({
        where: event_id ? eq(schema.routes.eventId, event_id) : undefined,
        with: {
          turns: true,
        },
      });
      return c.json(allRoutes);
    },
  )
  // Get a single route with its turns
  .get(
    "/:routeId",
    zValidator("param", z.object({ routeId: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { routeId } = c.req.valid("param");

      const route = await db.query.routes.findFirst({
        where: eq(schema.routes.id, routeId),
        with: {
          turns: true,
        },
      });

      if (!route) {
        return c.json({ error: "Route not found" }, 404);
      }
      return c.json(route);
    },
  )
  // Create a new route with turns
  .post(
    "/",
    zValidator("json", schema.createRouteWithTurnsSchema),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { name, eventId, turns } = c.req.valid("json");
      const newRoute = await db
        .insert(schema.routes)
        .values({ routeName: name, eventId })
        .returning();
      if (!newRoute) {
        return c.json({ error: "Failed to create route" }, 500);
      }
      const turnsToInsert = turns.map((turn) => ({
        ...turn,
        routeId: newRoute[0].id,
      }));
      const newTurns = await db
        .insert(schema.turns)
        .values(turnsToInsert)
        .returning();
      return c.json({ ...newRoute, turns: newTurns }, 201);
    },
  );
// #endregion Routes

// #region Runs
const runsApp = new Hono<{ Bindings: CfBindings }>()
  // List all runs (can be filtered by route_id or athlete_id)
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        route_id: z.coerce.number().optional(),
        athlete_id: z.coerce.number().optional(),
      }),
    ),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { route_id, athlete_id } = c.req.valid("query");

      const allRuns = await db.query.runs.findMany({
        where: and(
          route_id ? eq(schema.runs.routeId, route_id) : undefined,
          athlete_id ? eq(schema.runs.athleteId, athlete_id) : undefined,
        ),
        with: {
          clips: true,
        },
      });
      return c.json(allRuns);
    },
  )
  // Get a single run with its clips
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");

      const run = await db.query.runs.findFirst({
        where: eq(schema.runs.id, id),
        with: {
          clips: true,
        },
      });

      if (!run) {
        return c.json({ error: "Run not found" }, 404);
      }
      return c.json(run);
    },
  )
  // Create a new run with clips
  .post(
    "/",
    zValidator("json", schema.insertRunsSchema.omit({ runOrder: true })),
    async (c) => {
      const { DB } = c.env;
      const db = drizzle(DB, { schema });
      const { routeId, athleteId } = c.req.valid("json");

      const existingRuns = await db
        .select({ value: count() })
        .from(schema.runs)
        .where(
          and(
            eq(schema.runs.routeId, routeId),
            eq(schema.runs.athleteId, athleteId),
          ),
        );
      const runOrder = (existingRuns[0]?.value || 0) + 1;

      const [newRun] = await db
        .insert(schema.runs)
        .values({ routeId, athleteId, runOrder })
        .returning();

      if (!newRun) {
        return c.json({ error: "Failed to create run" }, 500);
      }

      return c.json(newRun, 201);
    },
  )

  // Get clips for a specific run
  .get(
    "/:runId/clips",
    zValidator("param", z.object({ runId: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { runId } = c.req.valid("param");

      const clips = await db
        .select({
          turnId: schema.clips.turnId,
          runId: schema.clips.runId,
          clipR2: schema.clips.clipR2,
          clipStreamId: schema.clips.clipStreamId,
          turnName: schema.turns.turnName,
        })
        .from(schema.clips)
        .leftJoin(schema.turns, eq(schema.clips.turnId, schema.turns.id))
        .where(eq(schema.clips.runId, runId))
        .all();

      return c.json(clips);
    },
  );

// #endregion Runs

// #region Turns
const turnsApp = new Hono<{ Bindings: CfBindings }>()
  // List all turns (can be filtered by route_id)
  .get(
    "/",
    zValidator("query", z.object({ route_id: z.coerce.number().optional() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { route_id } = c.req.valid("query");

      const allTurns = await db.query.turns.findMany({
        where: route_id ? eq(schema.turns.routeId, route_id) : undefined,
        with: {
          clips: true,
        },
      });
      return c.json(allTurns);
    },
  )
  // Get a single turn
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const turn = await db
        .select()
        .from(schema.turns)
        .where(eq(schema.turns.id, id))
        .get();
      if (!turn) {
        return c.json({ error: "Turn not found" }, 404);
      }
      return c.json(turn);
    },
  );
//#endregion Turns

interface GooglePlacesResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  name: string;
  types: string[];
  rating?: number;
  business_status?: string;
  price_level?: number;
  user_ratings_total?: number;
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface GooglePlacesResponse {
  results: GooglePlacesResult[];
  status: string;
  error_message?: string;
}

const app = new Hono<{ Bindings: CfBindings }>()
  .route("/api/turns", turnsApp)
  .route("/api/routes", routesApp)
  .route("/api/athletes", athletesApp)
  .route("/api/runs", runsApp)
  .route("/api/events", eventsApp)
  .get(
    "/api/geo",
    zValidator(
      "query",
      z.object({
        q: z.string().min(3, "Query must be at least 3 characters"),
      }),
    ),
    async (c) => {
      console.log(c.env.GOOGLE_MAPS_API_KEY);
      const { q } = c.req.valid("query");

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          q,
        )}&key=${c.env.GOOGLE_MAPS_API_KEY}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        return c.json({ error: "Geocoding service unavailable" }, 503);
      }

      const data = (await response.json()) as GooglePlacesResponse;

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error(
          "Google Places API error:",
          data.status,
          data.error_message,
        );
        return c.json({ error: "Geocoding service error" }, 500);
      }

      const transformedResults = data.results.slice(0, 5).map((result) => ({
        place_id: result.place_id,
        lat: result.geometry.location.lat.toString(),
        lon: result.geometry.location.lng.toString(),
        display_name: result.formatted_address,
        name: result.name,
        types: result.types,
        rating: result.rating,
        business_status: result.business_status,
        address_components: result.address_components,
      }));

      return c.json(transformedResults);
    },
  )
  .get("/api/clips/:clipStreamId/stream", async (c) => {
    const { clipStreamId } = c.req.param();
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/stream/${clipStreamId}`,
      {
        headers: {
          Authorization: `Bearer ${c.env.CLOUDFLARE_STREAM_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      return c.json(
        { error: "Failed to get stream URL" },
        { status: response.status },
      );
    }

    const data = await response.json();
    return c.json(data);
  })
  .post(
    "/api/runs/:runId/clips/:turnId/upload",
    zValidator(
      "param",
      z.object({
        runId: z.coerce.number(),
        turnId: z.coerce.number(),
      }),
    ),
    async (c) => {
      const { runId, turnId } = c.req.valid("param");
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });

      const videoName = `${runId}-${turnId}`;

      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${c.env.CLOUDFLARE_STREAM_TOKEN}`,
            "Tus-Resumable": "1.0.0",
            "Upload-Length": c.req.header("Upload-Length") || "",
            "Upload-Metadata": `name ${btoa(videoName)}`,
          },
        },
      );

      if (!response.ok) {
        return c.json({ error: "Failed to create upload" });
      }

      const destination = response.headers.get("Location") || "";

      const uid = response.headers.get("stream-media-id") || "";

      const clipData = {
        runId,
        turnId,
        clipStreamId: uid,
      };

      await db.insert(schema.clips).values(clipData).returning();

      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Expose-Headers": "Location",
          Location: destination,
        },
      });
    },
  )
  .get("/api/videos/:runId/:turnId", async (c) => {
    const runId = c.req.param("runId");
    const turnId = c.req.param("turnId");

    try {
      const range = c.req.header("range");
      const videoObject = await c.env.VIDEOS.get(`${runId}/${turnId}`);

      if (videoObject === null) {
        return c.json({ success: false, message: "Video not found" }, 404);
      }

      c.header("Accept-Ranges", "bytes");
      c.header(
        "Content-Type",
        videoObject.httpMetadata?.contentType || "application/octet-stream",
      );
      c.header("ETag", videoObject.httpEtag);

      if (range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(range);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : videoObject.size - 1;

          if (start >= videoObject.size || end >= videoObject.size) {
            return new Response("Range Not Satisfiable", {
              status: 416,
              headers: { "Content-Range": `bytes */${videoObject.size}` },
            });
          }

          const contentLength = end - start + 1;
          const rangedObject = await c.env.VIDEOS.get(`${runId}/${turnId}`, {
            range: { offset: start, length: contentLength },
          });

          if (rangedObject === null) {
            return new Response("Range Not Satisfiable", {
              status: 416,
              headers: { "Content-Range": `bytes */${videoObject.size}` },
            });
          }

          return new Response(rangedObject.body, {
            status: 206,
            headers: {
              "Content-Range": `bytes ${start}-${end}/${videoObject.size}`,
              "Content-Length": contentLength.toString(),
              "Content-Type":
                videoObject.httpMetadata?.contentType ||
                "application/octet-stream",
              "Accept-Ranges": "bytes",
              ETag: videoObject.httpEtag,
            },
          });
        }
      }

      // No range header, or invalid range, serve the full video
      c.header("Content-Length", String(videoObject.size));
      return c.body(videoObject.body, 200);
    } catch (e: any) {
      console.error("Error fetching video:", e);
      return c.json(
        {
          success: false,
          message: "An error occurred while fetching the video",
          error: e.message,
        },
        500,
      );
    }
  });

export default app;

export type AppType = typeof app;
