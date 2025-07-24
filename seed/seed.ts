import { hc } from "hono/client";
import type { AppType } from "../worker";
import type { 
  CreateEventRequest, 
  CreateAthleteRequest, 
  CreateRouteRequest, 
  CreateTurnRequest, 
  CreateRunRequest,
  Event,
  Athlete,
  Route,
  Run
} from "../worker/types";

// Hono RPC Client setup
const client = hc<AppType>('http://localhost:5173');

// Seed data based on existing mock structure but enhanced for skiing events
const seedEvents = [
  {
    event_name: "Winter Olympics 2024 - Alpine Skiing",
    event_location: "Cortina d'Ampezzo, Italy"
  },
  {
    event_name: "FIS World Cup - Aspen", 
    event_location: "Aspen, Colorado, USA"
  },
  {
    event_name: "Alpine World Championships",
    event_location: "Courchevel, France"
  }
];

const seedAthletes = [
  "Mikaela Shiffrin",
  "Marco Odermatt", 
  "Petra Vlhova",
  "Aleksander Aamodt Kilde",
  "Lara Gut-Behrami",
  "Henrik Kristoffersen"
];

const seedRoutes = [
  {
    route_name: "Corbet's Couloir",
    turns: [
      { turn_name: "Entry Gate", latitude: 43.5877, longitude: -110.8276 },
      { turn_name: "The Drop", latitude: 43.5875, longitude: -110.8278 },
      { turn_name: "Narrow Chute", latitude: 43.5873, longitude: -110.8280 },
      { turn_name: "Exit Bowl", latitude: 43.5871, longitude: -110.8282 }
    ]
  },
  {
    route_name: "The Hobacks", 
    turns: [
      { turn_name: "Top Entry", latitude: 43.5820, longitude: -110.8350 },
      { turn_name: "Steep Section", latitude: 43.5818, longitude: -110.8352 },
      { turn_name: "Tree Line", latitude: 43.5816, longitude: -110.8354 }
    ]
  },
  {
    route_name: "Rendezvous Bowl",
    turns: [
      { turn_name: "Bowl Entry", latitude: 43.5900, longitude: -110.8200 },
      { turn_name: "Center Line", latitude: 43.5898, longitude: -110.8202 },
      { turn_name: "Final Turn", latitude: 43.5896, longitude: -110.8204 }
    ]
  }
];

// Helper function to create delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Logging helper
const log = (message: string, data?: any) => {
  console.log(`🎿 [SEED] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

const logError = (message: string, error: any) => {
  console.error(`❌ [SEED ERROR] ${message}`, error);
};

const logSuccess = (message: string, data?: any) => {
  console.log(`✅ [SEED SUCCESS] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Main seeding function
async function seedDatabase() {
  log('Starting database seeding...');
  
  try {
    // Step 1: Create Events
    log('Creating events...');
    const createdEvents: Event[] = [];
    
    for (const eventData of seedEvents) {
      try {
        const response = await client.api.events.$post({
          json: eventData as CreateEventRequest
        });
        
        if (response.ok) {
          const result = await response.json() as Event;
          createdEvents.push(result);
          logSuccess(`Created event: ${eventData.event_name}`, result);
        } else {
          logError(`Failed to create event: ${eventData.event_name}`, await response.text());
        }
        
        await delay(100); // Small delay between requests
      } catch (error) {
        logError(`Error creating event: ${eventData.event_name}`, error);
      }
    }
    
    if (createdEvents.length === 0) {
      logError('No events were created. Stopping seed process.', null);
      return;
    }
    
    // Step 2: Create Athletes for each event
    log('Creating athletes...');
    const createdAthletes: Athlete[] = [];
    
    for (const event of createdEvents) {
      try {
        const response = await client.api.events[':eventId']['athletes'].$post({
          param: { eventId: event.id.toString() },
          json: { athletes: seedAthletes }
        });
        
        if (response.ok) {
          const result = await response.json() as Athlete[];
          createdAthletes.push(...result);
          logSuccess(`Created ${seedAthletes.length} athletes for event: ${event.event_name}`);
        } else {
          logError(`Failed to create athletes for event: ${event.event_name}`, await response.text());
        }
        
        await delay(100);
      } catch (error) {
        logError(`Error creating athletes for event: ${event.event_name}`, error);
      }
    }
    
    // Step 3: Create Routes with Turns for each event
    log('Creating routes with turns...');
    const createdRoutes: Route[] = [];
    
    for (const event of createdEvents) {
      for (const routeData of seedRoutes) {
        try {
          const response = await client.api.events[':eventId']['routes'].$post({
            param: { eventId: event.id.toString() },
            json: routeData as CreateRouteRequest
          });
          
          if (response.ok) {
            const result = await response.json() as Route;
            createdRoutes.push(result);
            logSuccess(`Created route: ${routeData.route_name} for event: ${event.event_name}`);
          } else {
            logError(`Failed to create route: ${routeData.route_name}`, await response.text());
          }
          
          await delay(100);
        } catch (error) {
          logError(`Error creating route: ${routeData.route_name}`, error);
        }
      }
    }
    
    // Step 4: Create Runs (athletes on routes)
    log('Creating runs...');
    let runOrder = 1;
    
    for (const event of createdEvents) {
      // Get athletes for this event
      const eventAthletes = createdAthletes.filter(athlete => athlete.event_id === event.id);
      // Get routes for this event  
      const eventRoutes = createdRoutes.filter(route => route.event_id === event.id);
      
      // Create runs for each athlete on each route
      for (const athlete of eventAthletes.slice(0, 3)) { // Limit to first 3 athletes per event
        for (const route of eventRoutes.slice(0, 2)) { // Limit to first 2 routes per athlete
          try {
            const runData: CreateRunRequest = {
              route_id: route.id,
              athlete_id: athlete.id,
              run_order: runOrder++
            };
            
            const response = await client.api.runs.$post({
              json: runData
            });
            
            if (response.ok) {
              const result = await response.json() as Run;
              logSuccess(`Created run for ${athlete.athlete_name} on ${route.route_name}`);
            } else {
              logError(`Failed to create run for ${athlete.athlete_name}`, await response.text());
            }
            
            await delay(100);
          } catch (error) {
            logError(`Error creating run for ${athlete.athlete_name}`, error);
          }
        }
      }
    }
    
    // Step 5: Summary
    log('Seeding completed!');
    logSuccess('Database seeding summary:', {
      events: createdEvents.length,
      athletes: createdAthletes.length,
      routes: createdRoutes.length,
      estimatedRuns: Math.min(createdAthletes.length, 18) // 3 athletes * 2 routes * 3 events
    });
    
  } catch (error) {
    logError('Fatal error during seeding', error);
    process.exit(1);
  }
}

// Error handling for the script
process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error);
  process.exit(1);
});

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  log('Starting seed script...');
  seedDatabase()
    .then(() => {
      logSuccess('Seed script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      logError('Seed script failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };