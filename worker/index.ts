import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { and, eq } from "drizzle-orm";

type CfBindings = {
  DB: D1Database;
  VIDEOS: R2Bucket;
};


//#region Events
const eventsApp = new Hono<{ Bindings: CfBindings }>()

  // List Events
  .get("/", async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });

    const allEvents = await db.select().from(schema.events).all();

    return c.json({
      success: true,
      data: allEvents,
    });
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
        return c.json({ success: false, error: "Event not found" }, 404);
      }

      return c.json({
        success: true,
        data: event,
      });
    }
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
      return c.json({ success: false, error: "Failed to create event" }, 500);
    }

    return c.json(
      {
        success: true,
        data: createdEvent,
      },
      201
    );
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
        return c.json({ success: false, error: "Event not found" }, 404);
      }

      return c.json({
        success: true,
        data: updatedEvent,
      });
    }
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
        return c.json({ success: false, error: "Event not found" }, 404);
      }

      return c.json({
        success: true,
        data: deletedEvent,
      });
    }
  );
//#endregion Events

//#region Athletes
const athletesApp = new Hono<{ Bindings: CfBindings }>()

  // List Athletes
  .get("/", async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });

    const allAthletes = await db.select().from(schema.athletes).all();

    return c.json({
      success: true,
      data: allAthletes,
    });
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
        return c.json({ success: false, error: "Athlete not found" }, 404);
      }

      return c.json({
        success: true,
        data: athlete,
      });
    }
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
      return c.json({ success: false, error: "Failed to create athlete" }, 500);
    }

    return c.json(
      {
        success: true,
        data: createdAthlete,
      },
      201
    );
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
        return c.json({ success: false, error: "Athlete not found" }, 404);
      }

      return c.json({
        success: true,
        data: updatedAthlete,
      });
    }
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
        return c.json({ success: false, error: "Athlete not found" }, 404);
      }

      return c.json({
        success: true,
        data: deletedAthlete,
      });
    }
  );
//#endregion Athletes

//#region Events_Athletes (Junction Table)
const eventsAthletesApp = new Hono<{ Bindings: CfBindings }>()

  // Link an Athlete to an Event (Create)
  .post(
    "/event/athletes",
    zValidator("json", schema.insertEventsToAthletesSchema),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });

      const linkData = c.req.valid("json");

      const [createdLink] = await db
        .insert(schema.eventsToAthletes)
        .values(linkData)
        .returning();

      if (!createdLink) {
        return c.json(
          { success: false, error: "Failed to link athlete to event" },
          500
        );
      }

      return c.json(
        {
          success: true,
          data: createdLink,
        },
        201
      );
    }
  )

  // Get all Athletes for a specific Event (Read)
  .get(
    "/event/:eventId/athletes",
    zValidator("param", z.object({ eventId: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });

      const { eventId } = c.req.valid("param");

      const athletesInEvent = await db
        .select({
          athleteId: schema.athletes.id,
          athleteName: schema.athletes.athleteName,
        })
        .from(schema.eventsToAthletes)
        .leftJoin(
          schema.athletes,
          eq(schema.eventsToAthletes.athleteId, schema.athletes.id)
        )
        .where(eq(schema.eventsToAthletes.eventId, eventId));

      return c.json({
        success: true,
        data: athletesInEvent,
      });
    }
  )

  // Unlink an Athlete from an Event (Delete)
  .delete(
    "/events/athlete",
    zValidator("json", schema.insertEventsToAthletesSchema),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { eventId, athleteId } = c.req.valid("json");

      const [deletedLink] = await db
        .delete(schema.eventsToAthletes)
        .where(
          and(
            eq(schema.eventsToAthletes.eventId, eventId),
            eq(schema.eventsToAthletes.athleteId, athleteId)
          )
        )
        .returning();

      if (!deletedLink) {
        return c.json({ success: false, error: "Link not found" }, 404);
      }

      return c.json({
        success: true,
        data: deletedLink,
      });
    }
  );
//#endregion Events_Athletes

//#region Routes
const createRouteWithTurnsSchema = z.object({
  // The API receives 'name' and maps it to the 'routeName' column.
  name: z.string().min(1, { message: "Route name cannot be empty." }),
  eventId: z.number(),
  turns: z
    .array(
      z.object({
        turnOrder: z.number().int().positive(),
        turnName: z.string().min(1),
        latitude: z.number(),
        longitude: z.number(),
      })
    )
    .min(1, { message: "A route must have at least one turn." }),
});

const updateRouteWithTurnsSchema = createRouteWithTurnsSchema.omit({
  eventId: true,
});

const routesApp = new Hono<{ Bindings: CfBindings }>()

  // Post Route
  .post("/", zValidator("json", createRouteWithTurnsSchema), async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });
    const { name, eventId, turns } = c.req.valid("json");

    const newRouteWithTurns = await db.transaction(async (tx) => {
      const [newRoute] = await tx
        .insert(schema.routes)
        .values({ routeName: name, eventId })
        .returning();

      if (!newRoute) {
        tx.rollback();
        return null;
      }

      const turnsToInsert = turns.map((turn) => ({
        ...turn,
        routeId: newRoute.id,
      }));

      const newTurns = await tx
        .insert(schema.turns)
        .values(turnsToInsert)
        .returning();

      return { ...newRoute, turns: newTurns };
    });

    if (!newRouteWithTurns) {
      return c.json({ success: false, error: "Failed to create route" }, 500);
    }

    return c.json(
      {
        success: true,
        data: newRouteWithTurns,
      },
      201
    );
  })

  // Update Route
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator("json", updateRouteWithTurnsSchema),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");
      const { name, turns } = c.req.valid("json");

      const updatedRouteWithTurns = await db.transaction(async (tx) => {
        const [updatedRoute] = await tx
          .update(schema.routes)
          .set({ routeName: name })
          .where(eq(schema.routes.id, id))
          .returning();

        if (!updatedRoute) {
          tx.rollback();
          return null;
        }

        await tx.delete(schema.turns).where(eq(schema.turns.routeId, id));

        const turnsToInsert = turns.map((turn) => ({
          ...turn,
          routeId: id,
        }));

        const newTurns = await tx
          .insert(schema.turns)
          .values(turnsToInsert)
          .returning();

        return { ...updatedRoute, turns: newTurns };
      });

      if (!updatedRouteWithTurns) {
        return c.json({ success: false, error: "Route not found" }, 404);
      }

      return c.json({
        success: true,
        data: updatedRouteWithTurns,
      });
    }
  )

  // Delete Route
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");

      const [deletedRoute] = await db
        .delete(schema.routes)
        .where(eq(schema.routes.id, id))
        .returning();

      if (!deletedRoute) {
        return c.json({ success: false, error: "Route not found" }, 404);
      }

      return c.json({
        success: true,
        data: deletedRoute,
      });
    }
  );
//#endregion Routes

//#region Runs
const runsApp = new Hono<{ Bindings: CfBindings }>()

  // List Runs
  .get("/", async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });

    const allRuns = await db.select().from(schema.runs).all();

    return c.json({
      success: true,
      data: allRuns,
    });
  })

  // Get Run
  .get(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });

      const { id } = c.req.valid("param");

      const run = await db
        .select()
        .from(schema.runs)
        .where(eq(schema.runs.id, id))
        .get();

      if (!run) {
        return c.json({ success: false, error: "Run not found" }, 404);
      }

      return c.json({
        success: true,
        data: run,
      });
    }
  )

  // Create Run
  .post("/", zValidator("json", schema.insertRunsSchema), async (c) => {
    const d1 = c.env.DB;
    const db = drizzle(d1, { schema });

    const run = c.req.valid("json");

    const [createdRun] = await db.insert(schema.runs).values(run).returning();

    if (!createdRun) {
      return c.json({ success: false, error: "Failed to create run" }, 500);
    }

    return c.json(
      {
        success: true,
        data: createdRun,
      },
      201
    );
  })

  // Update Run
  .put(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    zValidator("json", schema.insertRunsSchema.partial()),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });

      const { id } = c.req.valid("param");
      const runUpdateData = c.req.valid("json");

      const [updatedRun] = await db
        .update(schema.runs)
        .set(runUpdateData)
        .where(eq(schema.runs.id, id))
        .returning();

      if (!updatedRun) {
        return c.json({ success: false, error: "Run not found" }, 404);
      }

      return c.json({
        success: true,
        data: updatedRun,
      });
    }
  )

  // Delete Run
  .delete(
    "/:id",
    zValidator("param", z.object({ id: z.coerce.number() })),
    async (c) => {
      const d1 = c.env.DB;
      const db = drizzle(d1, { schema });
      const { id } = c.req.valid("param");

      const [deletedRun] = await db
        .delete(schema.runs)
        .where(eq(schema.runs.id, id))
        .returning();

      if (!deletedRun) {
        return c.json({ success: false, error: "Run not found" }, 404);
      }

      return c.json({
        success: true,
        data: deletedRun,
      });
    }
  );
//#endregion Runs

//#region Clips
const clipFormSchema = z.object({
  turnId: z.coerce.number(),
  runId: z.coerce.number(),
  video: z.instanceof(File, { message: "Video file is required" }),
});

const clipUpdateFormSchema = z.object({
  video: z.instanceof(File, { message: "New video file is required" }),
});

const clipsApp = new Hono<{ Bindings: CfBindings }>()

  // Create Clip (and upload video)
  .post("/", zValidator("form", clipFormSchema), async (c) => {
    const { DB, VIDEOS } = c.env;
    const db = drizzle(DB, { schema });
    const { turnId, runId, video } = c.req.valid("form");

    // A clip for a given turn and run should be unique.
    const existing = await db
      .select({ runId: schema.clips.runId, turnId: schema.clips.turnId })
      .from(schema.clips)
      .where(
        and(eq(schema.clips.runId, runId), eq(schema.clips.turnId, turnId))
      )
      .get();
    if (existing) {
      return c.json(
        {
          success: false,
          error: "A clip for this run and turn already exists",
        },
        409
      );
    }

    const key = `clips/run-${runId}/turn-${turnId}/${crypto.randomUUID()}-${
      video.name
    }`;

    try {
      await VIDEOS.put(key, await video.arrayBuffer(), {
        httpMetadata: { contentType: video.type },
      });
    } catch (e) {
      return c.json({ success: false, error: "Failed to upload video" }, 500);
    }

    const [createdClip] = await db
      .insert(schema.clips)
      .values({ turnId, runId, clipR2: key })
      .returning();

    if (!createdClip) {
      await VIDEOS.delete(key); // Clean up orphaned R2 object
      return c.json(
        { success: false, error: "Failed to create clip in DB" },
        500
      );
    }

    return c.json({ success: true, data: createdClip }, 201);
  })

  // Get a specific clip's details
  .get(
    "/:runId/:turnId",
    zValidator(
      "param",
      z.object({ runId: z.coerce.number(), turnId: z.coerce.number() })
    ),
    async (c) => {
      const { DB } = c.env;
      const db = drizzle(DB, { schema });
      const { runId, turnId } = c.req.valid("param");

      const clip = await db
        .select()
        .from(schema.clips)
        .where(
          and(eq(schema.clips.runId, runId), eq(schema.clips.turnId, turnId))
        )
        .get();

      if (!clip) {
        return c.json({ success: false, error: "Clip not found" }, 404);
      }

      return c.json({ success: true, data: clip });
    }
  )

  // Update a Clip's video
  .put(
    "/:runId/:turnId",
    zValidator(
      "param",
      z.object({ runId: z.coerce.number(), turnId: z.coerce.number() })
    ),
    zValidator("form", clipUpdateFormSchema),
    async (c) => {
      const { DB, VIDEOS } = c.env;
      const db = drizzle(DB, { schema });
      const { runId, turnId } = c.req.valid("param");
      const { video } = c.req.valid("form");

      const existingClip = await db
        .select({ clipR2: schema.clips.clipR2 })
        .from(schema.clips)
        .where(
          and(eq(schema.clips.runId, runId), eq(schema.clips.turnId, turnId))
        )
        .get();

      if (!existingClip) {
        return c.json({ success: false, error: "Clip not found" }, 404);
      }

      const oldKey = existingClip.clipR2;
      const newKey = `clips/run-${runId}/turn-${turnId}/${crypto.randomUUID()}-${
        video.name
      }`;

      try {
        await VIDEOS.put(newKey, await video.arrayBuffer(), {
          httpMetadata: { contentType: video.type },
        });

        const [updatedClip] = await db
          .update(schema.clips)
          .set({ clipR2: newKey })
          .where(
            and(eq(schema.clips.runId, runId), eq(schema.clips.turnId, turnId))
          )
          .returning();

        if (!updatedClip) {
          await VIDEOS.delete(newKey); // Clean up if DB update fails
          return c.json(
            { success: false, error: "Failed to update clip in DB" },
            500
          );
        }

        // After everything is successful, delete the old video if it existed
        if (oldKey) {
          await VIDEOS.delete(oldKey);
        }

        return c.json({ success: true, data: updatedClip });
      } catch (e) {
        // Attempt to clean up the newly uploaded file if any error occurred
        await VIDEOS.delete(newKey).catch(() => {});
        return c.json({ success: false, error: "Failed to update video" }, 500);
      }
    }
  );
//#endregion Clips
const app = new Hono<{ Bindings: CfBindings }>()
.route("api/events", eventsApp)
.route("api/athletes", athletesApp)
.route("api/", eventsAthletesApp)
.route("api/routes", routesApp)
.route("api/runs", runsApp)
.route("api/clips", clipsApp);
export default app;

export type AppType = typeof app;

