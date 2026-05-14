import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase client (service role needed for some operations, or admin check)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

// Gemini AI Setup
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Google OAuth client helper
const getOAuth2Client = (req?: express.Request) => {
  let redirectUri = process.env.GOOGLE_REDIRECT_URI;
  
  if (!redirectUri && req) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    redirectUri = `${protocol}://${host}/api/auth/google/callback`;
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || 'http://localhost:3000/api/auth/google/callback'
  );
};

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

// 1. Auth Flow: Get Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const client = getOAuth2Client(req);
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

// 2. Auth Flow: Callback
app.get('/api/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const client = getOAuth2Client(req);
    const { tokens } = await client.getToken(code as string);
    
    if (tokens.refresh_token) {
      // Store in DB
      const adminEmail = 'admin@company.com'; // Hardcoded for demo/admin
      const { data: userData } = await supabase.from('candidates').select('id').eq('email', adminEmail).single();
      
      if (userData) {
        await supabase.from('interviewer_tokens').upsert({
          user_id: userData.id,
          refresh_token: tokens.refresh_token,
          access_token: tokens.access_token,
          expiry_date: tokens.expiry_date,
          updated_at: new Date().toISOString()
        });
      }
    }
    
    res.send(`
      <html>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 1rem; shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <h1 style="color: #0f172a; margin-bottom: 0.5rem;">Authentication Successful</h1>
            <p style="color: #64748b;">You can close this window now.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                setTimeout(() => window.close(), 1000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Error:', error);
    res.status(500).send('Authentication failed');
  }
});

// 3. AI Powered Slot Suggestion
app.post('/api/interviews/suggest-slots', async (req, res) => {
  const { applicationId, candidateId } = req.body;
  
  try {
    const client = getOAuth2Client(req);
    // Fetch interviewer token (for simplicity using admin)
    const { data: tokenData } = await supabase.from('interviewer_tokens').select('*').limit(1).single();
    
    if (!tokenData) {
      return res.status(401).json({ error: 'Interviewer Calendar not connected' });
    }

    client.setCredentials({
      refresh_token: tokenData.refresh_token,
      access_token: tokenData.access_token
    });

    const calendar = google.calendar({ version: 'v3', auth: client });
    
    // Define range: Next week Mon-Fri
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + (1 + 7 - now.getDay()) % 7);
    if (nextMonday <= now) nextMonday.setDate(nextMonday.getDate() + 7);
    nextMonday.setHours(0, 0, 0, 0);

    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);
    nextFriday.setHours(23, 59, 59, 999);

    // Get busy slots
    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: nextMonday.toISOString(),
        timeMax: nextFriday.toISOString(),
        items: [{ id: 'primary' }]
      }
    });

    const busySlots = freeBusy.data.calendars?.primary?.busy || [];

    // Use Gemini to suggest optimized slots
    const prompt = `
      I need to schedule an interview next week (Monday to Friday, 10:00 AM to 5:00 PM).
      Current busy slots for the interviewer: ${JSON.stringify(busySlots)}
      Timezone: IST (UTC+5:30)
      
      Generate a list of 10 recommended 30-minute interview slots.
      Ensure slots do not overlap with busy slots.
      Prefer mornings or early afternoons.
      Format: JSON array of objects with start and end as ISO strings.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING },
              end: { type: Type.STRING }
            },
            required: ['start', 'end']
          }
        }
      }
    });

    const suggestedSlots = JSON.parse(result.text);
    res.json({ slots: suggestedSlots });

  } catch (error) {
    console.error('Scheduling Suggestion Error:', error);
    res.status(500).json({ error: 'Failed to suggest slots' });
  }
});

// 4. Create Interview & Calendar Event
app.post('/api/interviews/book', async (req, res) => {
  const { applicationId, candidateId, startTime, endTime } = req.body;

  try {
    const client = getOAuth2Client(req);
    // 1. Get token
    const { data: tokenData } = await supabase.from('interviewer_tokens').select('*').limit(1).single();
    if (!tokenData) return res.status(401).json({ error: 'Interviewer Calendar not connected' });

    client.setCredentials({ refresh_token: tokenData.refresh_token });
    const calendar = google.calendar({ version: 'v3', auth: client });

    // 2. Fetch candidate info for email
    const { data: candidate } = await supabase.from('candidates').select('email, full_name').eq('id', candidateId).single();

    // 3. Create Google Calendar Event
    const event = {
      summary: `Interview: ${candidate?.full_name || 'Candidate'}`,
      description: 'Interview for HirePilot AI position.',
      start: { dateTime: startTime, timeZone: 'Asia/Kolkata' },
      end: { dateTime: endTime, timeZone: 'Asia/Kolkata' },
      attendees: [{ email: candidate?.email }],
      conferenceData: {
        createRequest: {
          requestId: `interview-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    };

    const calendarEvent = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    // 4. Store in DB
    const { data: interview, error: dbError } = await supabase.from('interviews').insert({
      application_id: applicationId,
      candidate_id: candidateId,
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled',
      meet_link: calendarEvent.data.hangoutLink,
      calendar_event_id: calendarEvent.data.id
    }).select().single();

    if (dbError) throw dbError;

    // 5. Update Application Status
    await supabase.from('applications').update({ status: 'shortlisted' }).eq('id', applicationId);

    res.json({ success: true, interview });

  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({ error: 'Failed to book interview' });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
