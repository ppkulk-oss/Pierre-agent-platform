const { google } = require('googleapis');
const fs = require('fs');

// Configuration
const CALENDAR_ID = 'pierredugatpy@gmail.com';
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Authenticate using Service Account JWT
 */
function authenticate() {
  const credentialsJson = process.env.GOOGLE_CALENDAR_KEY;
  
  if (!credentialsJson) {
    throw new Error('GOOGLE_CALENDAR_KEY environment variable not set');
  }
  
  const credentials = JSON.parse(credentialsJson);
  
  const auth = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key,
    SCOPES
  );
  
  return auth;
}

/**
 * List events from the calendar
 */
async function listEvents() {
  try {
    const auth = authenticate();
    const calendar = google.calendar({ version: 'v3', auth });
    
    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    const events = response.data.items;
    
    if (!events || events.length === 0) {
      console.log('No upcoming events found.');
      return [];
    }
    
    console.log('Upcoming events:');
    events.forEach((event, i) => {
      const start = event.start.dateTime || event.start.date;
      console.log(`${i + 1}. ${event.summary} (${start})`);
    });
    
    return events;
  } catch (error) {
    console.error('Error listing events:', error.message);
    throw error;
  }
}

/**
 * Create a new event
 */
async function createEvent(summary, startTime, endTime, description = '') {
  try {
    const auth = authenticate();
    const calendar = google.calendar({ version: 'v3', auth });
    
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/New_York',
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      resource: event,
    });
    
    console.log('Event created successfully!');
    console.log(`Event ID: ${response.data.id}`);
    console.log(`Summary: ${response.data.summary}`);
    console.log(`Start: ${response.data.start.dateTime}`);
    console.log(`Link: ${response.data.htmlLink}`);
    
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error.message);
    throw error;
  }
}

// CLI entry point
async function main() {
  const command = process.argv[2];
  
  if (command === 'list') {
    await listEvents();
  } else if (command === 'create') {
    // Create test event: "System Initialization" for tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0);
    
    await createEvent(
      'System Initialization',
      tomorrow.toISOString(),
      endTime.toISOString(),
      'Test event created by Pierre'
    );
  } else {
    console.log('Usage: node index.js [list|create]');
    console.log('  list  - List upcoming events');
    console.log('  create - Create test event "System Initialization"');
  }
}

// Export functions for use as module
module.exports = { listEvents, createEvent };

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}