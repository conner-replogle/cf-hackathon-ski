import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

// Zod validation schemas
const EventSchema = z.object({
  event_name: z.string().min(1, 'Event name is required')
});

const AthleteSchema = z.object({
  athlete_name: z.string().min(1, 'Athlete name is required')
});

const TrailSchema = z.object({
  trail_name: z.string().min(1, 'Trail name is required'),
  event_id: z.number().int().positive('Event ID must be a positive integer')
});

const RunSchema = z.object({
  run_name: z.string().min(1, 'Run name is required'),
  event_id: z.number().int().positive('Event ID must be a positive integer'),
  athlete_id: z.number().int().positive('Athlete ID must be a positive integer'),
  trail_id: z.number().int().positive('Trail ID must be a positive integer')
});

const TurnSchema = z.object({
  turn_name: z.string().min(1, 'Turn name is required'),
  trail_id: z.number().int().positive('Trail ID must be a positive integer'),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

const ClipSchema = z.object({
  turn_id: z.number().int().positive('Turn ID must be a positive integer'),
  run_id: z.number().int().positive('Run ID must be a positive integer'),
  r2_video_link: z.string().url('Must be a valid URL').optional()
});

// Mock data
const mockEvents = [
  { event_id: 1, event_name: 'Winter Olympics 2024' },
  { event_id: 2, event_name: 'World Cup Aspen' },
  { event_id: 3, event_name: 'FIS Alpine Championships' }
];

const mockAthletes = [
  { athlete_id: 1, athlete_name: 'Mikaela Shiffrin' },
  { athlete_id: 2, athlete_name: 'Marco Odermatt' },
  { athlete_id: 3, athlete_name: 'Petra Vlhova' },
  { athlete_id: 4, athlete_name: 'Aleksander Aamodt Kilde' }
];

const mockTrails = [
  { trail_id: 1, trail_name: 'Corbet\'s Couloir', event_id: 1 },
  { trail_id: 2, trail_name: 'The Hobacks', event_id: 1 },
  { trail_id: 3, trail_name: 'Rendezvous Bowl', event_id: 2 },
  { trail_id: 4, trail_name: 'Casper Bowl', event_id: 2 },
  { trail_id: 5, trail_name: 'Alta Chutes', event_id: 3 }
];

const mockRuns = [
  { run_id: 1, run_name: 'Qualifying Run 1', event_id: 1, athlete_id: 1, trail_id: 1 },
  { run_id: 2, run_name: 'Final Run', event_id: 1, athlete_id: 2, trail_id: 1 },
  { run_id: 3, run_name: 'Practice Run', event_id: 2, athlete_id: 3, trail_id: 3 },
  { run_id: 4, run_name: 'Competition Run', event_id: 2, athlete_id: 4, trail_id: 4 },
  { run_id: 5, run_name: 'Warm-up Run', event_id: 3, athlete_id: 1, trail_id: 5 }
];

const mockTurns: Array<{
  turn_id: number;
  turn_name: string;
  trail_id: number;
  latitude: number | null;
  longitude: number | null;
}> = [
  { turn_id: 1, turn_name: 'Gate 1', trail_id: 1, latitude: 43.5877, longitude: -110.8262 },
  { turn_id: 2, turn_name: 'Gate 2', trail_id: 1, latitude: 43.5875, longitude: -110.8260 },
  { turn_id: 3, turn_name: 'Gate 3', trail_id: 1, latitude: 43.5873, longitude: -110.8258 },
  { turn_id: 4, turn_name: 'Gate 1', trail_id: 3, latitude: 43.5880, longitude: -110.8270 },
  { turn_id: 5, turn_name: 'Gate 2', trail_id: 3, latitude: 43.5878, longitude: -110.8268 }
];

const mockClips: Array<{
  video_id: number;
  turn_id: number;
  run_id: number;
  r2_video_link: string | null;
}> = [
  { video_id: 1, turn_id: 1, run_id: 1, r2_video_link: 'https://example.com/video1.mp4' },
  { video_id: 2, turn_id: 2, run_id: 1, r2_video_link: 'https://example.com/video2.mp4' },
  { video_id: 3, turn_id: 3, run_id: 2, r2_video_link: 'https://example.com/video3.mp4' },
  { video_id: 4, turn_id: 4, run_id: 3, r2_video_link: 'https://example.com/video4.mp4' },
  { video_id: 5, turn_id: 5, run_id: 4, r2_video_link: 'https://example.com/video5.mp4' }
];

const app = new Hono<{ Bindings: Cloudflare.Env }>()
  // Events endpoints
  .post('/api/events', zValidator('json', EventSchema), async (c) => {
    const { event_name } = c.req.valid('json');
    const newEvent = {
      event_id: mockEvents.length + 1,
      event_name
    };
    mockEvents.push(newEvent);
    return c.json({ success: true, message: 'Event created successfully', event: newEvent });
  })
  .get('/api/events', async (c) => {
    return c.json(mockEvents );
  })
  .get('/api/events/:eventId', async (c) => {
    const eventId = parseInt(c.req.param('eventId'));
    const event = mockEvents.find(e => e.event_id === eventId);
    if (!event) {
      return c.json({ success: false, message: 'Event not found' }, 404);
    }
    return c.json(event);
  })

  // Athletes endpoints
  .post('/api/athletes', zValidator('json', AthleteSchema), async (c) => {
    const { athlete_name } = c.req.valid('json');
    const newAthlete = {
      athlete_id: mockAthletes.length + 1,
      athlete_name
    };
    mockAthletes.push(newAthlete);
    return c.json({ success: true, message: 'Athlete created successfully', athlete: newAthlete });
  })
  .get('/api/athletes', async (c) => {
    return c.json({ success: true, athletes: mockAthletes });
  })
  .get('/api/athletes/:athleteId', async (c) => {
    const athleteId = parseInt(c.req.param('athleteId'));
    const athlete = mockAthletes.find(a => a.athlete_id === athleteId);
    if (!athlete) {
      return c.json({ success: false, message: 'Athlete not found' }, 404);
    }
    return c.json(athlete);
  })


  // Trails endpoints
  .post('/api/trails', zValidator('json', TrailSchema), async (c) => {
    const { trail_name, event_id } = c.req.valid('json');
    const event = mockEvents.find(e => e.event_id === event_id);
    if (!event) {
      return c.json({ success: false, message: 'Event not found' }, 404);
    }
    const newTrail = {
      trail_id: mockTrails.length + 1,
      trail_name,
      event_id
    };
    mockTrails.push(newTrail);
    return c.json({ success: true, message: 'Trail created successfully', trail: newTrail });
  })
  .get('/api/trails', async (c) => {
    return c.json(mockTrails );
  })
  .get('/api/trails/:trailId', async (c) => {
    const trailId = parseInt(c.req.param('trailId'));
    const trail = mockTrails.find(t => t.trail_id === trailId);
    if (!trail) {
      return c.json({ success: false, message: 'Trail not found' }, 404);
    }
    return c.json(trail);
  })
  .get('/api/events/:eventId/trails', async (c) => {
    const eventId = parseInt(c.req.param('eventId'));
    const trails = mockTrails.filter(t => t.event_id === eventId);
    return c.json(trails);
  })

  // Runs endpoints
  .post('/api/runs', zValidator('json', RunSchema), async (c) => {
    const { run_name, event_id, athlete_id, trail_id } = c.req.valid('json');
    
    const event = mockEvents.find(e => e.event_id === event_id);
    const athlete = mockAthletes.find(a => a.athlete_id === athlete_id);
    const trail = mockTrails.find(t => t.trail_id === trail_id);
    
    if (!event) return c.json({ success: false, message: 'Event not found' }, 404);
    if (!athlete) return c.json({ success: false, message: 'Athlete not found' }, 404);
    if (!trail) return c.json({ success: false, message: 'Trail not found' }, 404);
    
    const newRun = {
      run_id: mockRuns.length + 1,
      run_name,
      event_id,
      athlete_id,
      trail_id
    };
    mockRuns.push(newRun);
    return c.json({ success: true, message: 'Run created successfully', run: newRun });
  })
  .get('/api/runs', async (c) => {
    return c.json(mockRuns);
  })
  .get('/api/runs/:runId', async (c) => {
    const runId = parseInt(c.req.param('runId'));
    const run = mockRuns.find(r => r.run_id === runId);
    if (!run) {
      return c.json({ success: false, message: 'Run not found' }, 404);
    }
    
    const athlete = mockAthletes.find(a => a.athlete_id === run.athlete_id);
    const trail = mockTrails.find(t => t.trail_id === run.trail_id);
    const event = mockEvents.find(e => e.event_id === run.event_id);
    
    return c.json({ 
      success: true, 
      run: {
        ...run,
        athlete,
        trail,
        event
      }
    });
  })
  .get('/api/events/:eventId/runs', async (c) => {
    const eventId = parseInt(c.req.param('eventId'));
    const runs = mockRuns.filter(r => r.event_id === eventId);
    return c.json(runs);
  })
  .get('/api/trails/:trailId/runs', async (c) => {
    const trailId = parseInt(c.req.param('trailId'));
    const runs = mockRuns.filter(r => r.trail_id === trailId);
    return c.json(runs);
  })
  .get('/api/athletes/:athleteId/runs', async (c) => {
    const athleteId = parseInt(c.req.param('athleteId'));
    const runs = mockRuns.filter(r => r.athlete_id === athleteId);
    return c.json(runs);
  })

  // Turns endpoints
  .post('/api/turns', zValidator('json', TurnSchema), async (c) => {
    const { turn_name, trail_id, latitude, longitude } = c.req.valid('json');
    
    const trail = mockTrails.find(t => t.trail_id === trail_id);
    if (!trail) {
      return c.json({ success: false, message: 'Trail not found' }, 404);
    }
    
    const newTurn = {
      turn_id: mockTurns.length + 1,
      turn_name,
      trail_id,
      latitude: latitude || null,
      longitude: longitude || null
    };
    mockTurns.push(newTurn);
    return c.json({ success: true, message: 'Turn created successfully', turn: newTurn });
  })
  .get('/api/turns', async (c) => {
    return c.json(mockTurns);
  })
  .get('/api/turns/:turnId', async (c) => {
    const turnId = parseInt(c.req.param('turnId'));
    const turn = mockTurns.find(t => t.turn_id === turnId);
    if (!turn) {
      return c.json({ success: false, message: 'Turn not found' }, 404);
    }
    return c.json(turn);
  })
  .get('/api/trails/:trailId/turns', async (c) => {
    const trailId = parseInt(c.req.param('trailId'));
    const turns = mockTurns.filter(t => t.trail_id === trailId);
    return c.json(turns);
  })
  .get('/api/runs/:runId/turns', async (c) => {
    const runId = parseInt(c.req.param('runId'));
    const run = mockRuns.find(r => r.run_id === runId);
    if (!run) {
      return c.json({ success: false, message: 'Run not found' }, 404);
    }
    const turns = mockTurns.filter(t => t.trail_id === run.trail_id);
    return c.json(turns);
  })

  // Clips endpoints
  .post('/api/clips', zValidator('json', ClipSchema), async (c) => {
    const { turn_id, run_id, r2_video_link } = c.req.valid('json');
    
    const turn = mockTurns.find(t => t.turn_id === turn_id);
    const run = mockRuns.find(r => r.run_id === run_id);
    
    if (!turn) return c.json({ success: false, message: 'Turn not found' }, 404);
    if (!run) return c.json({ success: false, message: 'Run not found' }, 404);
    
    const newClip = {
      video_id: mockClips.length + 1,
      turn_id,
      run_id,
      r2_video_link: r2_video_link || null
    };
    mockClips.push(newClip);
    return c.json({ success: true, message: 'Clip created successfully', clip: newClip });
  })
  .get('/api/clips', async (c) => {
    return c.json(mockClips);
  })
  .get('/api/clips/:videoId', async (c) => {
    const videoId = parseInt(c.req.param('videoId'));
    const clip = mockClips.find(c => c.video_id === videoId);
    if (!clip) {
      return c.json({ success: false, message: 'Clip not found' }, 404);
    }
    return c.json(clip);
  })
  .get('/api/turns/:turnId/clips', async (c) => {
    const turnId = parseInt(c.req.param('turnId'));
    const clips = mockClips.filter(c => c.turn_id === turnId);
    return c.json(clips);
  })
  .get('/api/runs/:runId/clips', async (c) => {
    const runId = parseInt(c.req.param('runId'));
    const clips = mockClips.filter(c => c.run_id === runId);
    return c.json(clips);
  });

export default app;
export type AppType = typeof app;