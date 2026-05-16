---
name: Interview Scheduler
description: A full-stack application for managing candidate interview scheduling, including Google Calendar integration for PM availability checks and automatic meeting invitations.
---

# Interview Scheduler Skill

This skill provides utilities and architectural patterns for managing candidate interviews and interacting with the Google Calendar API.

## Core Features

- **PM Availability Tracking:** Fetches busy events from the specific Project Manager's primary Google Calendar.
- **Scheduling Logic:** Allows administrators to select a candidate, a PM, a date, and a time to schedule an interview.
- **Calendar Integration:**
  - `GET /api/calendar/list`: Fetches events for a specific employee email to determine availability (busy slots).
  - `POST /api/calendar/schedule`: Creates a calendar event with the PM and Candidate added as attendees, effectively sending invitations.

## Architectural Components

### Backend (`server.ts`)

The backend acts as the secure proxy for the Google Calendar API.

- **Dependencies:** Requires `@google/generative-ai` (for other features) and `googleapis` (for Calendar).
- **Endpoint Pattern:**
  - All calendar operations are handled server-side to keep service account/OAuth credentials secure.
  - Integration relies on the `googleapis` library.

### Frontend (`src/pages/AdminDashboard.tsx`)

The main UI component for interacting with the scheduling system.

- **State Management:** Manages `selectedCandidate`, `selectedPM`, `pmEvents` (for busy slots visualization), and scheduling form data (`date`, `time`).
- **UI Patterns:**
  - Uses conditional rendering to display PM busy slots.
  - Implements modal-like scheduling forms.

## Implementation Guidelines

1. **Authentication:** Always ensure the user is authorized before making calendar requests. The application expects valid credentials for the Google Calendar API.
2. **API Interaction:** When scheduling, ensure both PM (`employeeEmail`) and candidate (`candidateEmail`) are passed in the `attendees` array to the Google Calendar `events.insert` call to ensure invitations are sent.
3. **Availability Visualization:** When displaying busy slots, convert start/end times appropriately to the local timezone to avoid misunderstandings in scheduling.
4. **Error Handling:** Use the `handleFirestoreError` pattern (if applicable) or standardized JSON error responses for backend API failures.

## Usage

```typescript
// Example: Fetching PM events
const fetchPMEvents = async (pmEmail: string) => {
  const resp = await fetch(`/api/calendar/list?employeeEmail=${encodeURIComponent(pmEmail)}`);
  const data = await resp.json();
  setPmEvents(data.events || []);
};

// Example: Scheduling an interview
const scheduleInterview = async () => {
    const resp = await fetch('/api/calendar/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeEmail: selectedPM,
          candidateEmail: selectedCandidate.candidate.email,
          title: `Interview: ${selectedCandidate.candidate.full_name}`,
          date: date,
          time: time,
          duration: 30
        })
      });
}
```
