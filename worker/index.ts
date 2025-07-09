import { Hono } from 'hono';

// Define the bindings for D1 and R2
type Bindings = {
  DB: D1Database;
  VIDEOS: R2Bucket;
  R2_PUBLIC_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// // Add CORS middleware to allow all origins
// app.use('/api/*', cors());


/**
 * Creates a new athlete.
 * @body { athlete_name: string }
 * @returns { success: boolean, message: string }
 */
app.post('/api/athletes', async (c) => {
  try {
    const { athlete_name } = await c.req.json();
    if (!athlete_name) {
      return c.json({ success: false, message: 'Athlete name is required' }, 400);
    }

    await c.env.DB.prepare('INSERT INTO Athletes (athlete_name) VALUES (?)')
      .bind(athlete_name)
      .run();

    return c.json({ success: true, message: 'Athlete created successfully' });
  } catch (e: any) {
    // Check for unique constraint violation
    if (e.message?.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Athlete name already exists' }, 409);
    }
    return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
  }
});

/**
 * Lists all athletes.
 * @returns { success: boolean, athletes: Array<{ athlete_id: number, athlete_name: string }> }
 */
app.get('/api/athletes', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM Athletes').all();
    return c.json({ success: true, athletes: results });
  } catch (e: any) {
    return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
  }
});


/**
 * Creates a new event.
 * @body { event_name: string }
 * @returns { success: boolean, message: string }
 */
app.post('/api/events', async (c) => {
  try {
    const { event_name } = await c.req.json();
    if (!event_name) {
      return c.json({ success: false, message: 'Event name is required' }, 400);
    }

    await c.env.DB.prepare('INSERT INTO Event (event_name) VALUES (?)')
      .bind(event_name)
      .run();

    return c.json({ success: true, message: 'Event created successfully' });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Event name already exists' }, 409);
    }
    return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
  }
});

/**
 * Lists all events.
 * @returns { success: boolean, events: Array<{ event_id: number, event_name: string }> }
 */
app.get('/api/events', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM Event').all();
    return c.json({ success: true, events: results });
  } catch (e: any) {
    return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
  }
});

/**
 * Creates a new run.
 * @body { run_name: string, event_id: number, athlete_id: number }
 * @returns { success: boolean, message: string }
 */
app.post('/api/runs', async (c) => {
  try {
    const { run_name, event_id, athlete_id } = await c.req.json();
    if (!run_name || !event_id || !athlete_id) {
      return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    await c.env.DB.prepare('INSERT INTO Run (run_name, event_id, athlete_id) VALUES (?, ?, ?)')
      .bind(run_name, event_id, athlete_id)
      .run();

    return c.json({ success: true, message: 'Run created successfully' });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      return c.json({ success: false, message: 'Run name already exists' }, 409);
    }
    return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
  }
});

/**
 * Lists all runs for a given event.
 * @param { eventId: number }
 * @returns { success: boolean, runs: Array<any> }
 */
app.get('/api/events/:eventId/runs', async (c) => {
    try {
        const eventId = c.req.param('eventId');
        const { results } = await c.env.DB.prepare('SELECT * FROM Run WHERE event_id = ?')
            .bind(eventId)
            .all();
        return c.json({ success: true, runs: results });
    } catch (e: any) {
        return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
    }
});


/**
 * Creates a new turn.
 * @body { turn_name: string, event_id: number, athlete_id: number, run_id: number }
 * @returns { success: boolean, message: string }
 */
app.post('/api/turns', async (c) => {
  try {
    // 1. Destructure run_id from the request body
    const { turn_name, event_id, athlete_id, run_id } = await c.req.json();

    // 2. Add run_id to the validation check
    if (!turn_name || !event_id || !athlete_id || !run_id) {
        return c.json({ success: false, message: 'Missing required fields' }, 400);
    }

    // 3. Add run_id to the INSERT statement
    await c.env.DB.prepare('INSERT INTO Turns (turn_name, event_id, athlete_id, run_id) VALUES (?, ?, ?, ?)')
        .bind(turn_name, event_id, athlete_id, run_id)
        .run();

    return c.json({ success: true, message: 'Turn created successfully' });
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
        return c.json({ success: false, message: 'Turn name already exists' }, 409);
    }
    return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
  }
});

/**
 * Lists all turns for a given run.
 * @param { runId: number }
 * @returns { success: boolean, turns: Array<any> }
 */
app.get('/api/runs/:runId/turns', async (c) => {
  try {
      const runId = c.req.param('runId');

      // Directly query the Turns table using the run_id
      const { results } = await c.env.DB.prepare('SELECT * FROM Turns WHERE run_id = ?')
          .bind(runId)
          .all();
          
      return c.json({ success: true, turns: results });
  } catch (e: any) {
      return c.json({ success: false, message: 'An error occurred', error: e.message }, 500);
  }
});



/**
 * Uploads a video for a specific turn and updates its R2 link.
 * @param { turnId: number }
 * @body { video: File }
 * @returns { success: boolean, message: string, r2_url: string }
 */
app.post('/api/turns/:turnId/upload', async (c) => {
      const turnId = c.req.param('turnId');
      const body = await c.req.parseBody();
      const videoFile = body['video'] as File;

      if (!videoFile) {
          return c.json({ success: false, message: 'Video file is required' }, 400);
      }

      // Check if turn exists
      const turn = await c.env.DB.prepare('SELECT * FROM Turns WHERE turn_id = ?').bind(turnId).first();
      if (!turn) {
          return c.json({ success: false, message: 'Turn not found' }, 404);
      }


      // Upload to R2
      const res = await c.env.VIDEOS.put(videoFile.name, videoFile.stream(), {
          httpMetadata: { contentType: videoFile.type },
      });

      // Update the database
      await c.env.DB.prepare('UPDATE Turns SET r2_video_link = ? WHERE turn_id = ?')
          .bind(res.key, turnId)
          .run();

      return c.json({ success: true, message: 'Video uploaded successfully', r2_url: res.key });

});


app.get('/api/videos/:videoId', async (c) => {
  const videoId = c.req.param('videoId');
  try {
    // Fetch the video from R2
    const video = await c.env.VIDEOS.get(videoId);
    if (!video) { 
      return c.json({ success: false, message: 'Video not found' }, 404);
    }
    // Set the appropriate headers
    c.header('Content-Type', video.httpMetadata?.contentType || 'application/octet-stream');
    c.header('Content-Length', String(video.size));
    c.header('Content-Disposition', `inline; filename="${videoId}"`);
    // Return the video stream
    return c.body(video.body, 200);
  } catch (e: any) {
    console.error('Error fetching video:', e);
    return c.json({ success: false, message: 'An error occurred while fetching the video', error: e.message }, 500);
  }
});


export default app;
export type AppType = typeof app;