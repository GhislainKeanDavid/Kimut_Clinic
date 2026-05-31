# Kimut Clinic — Feature Plan: Showed Up Follow-up, GCal Sync, PT Selection

## Overview

Three features, ordered from simplest to most complex:

| # | Feature | Complexity | Touches |
|---|---|---|---|
| 1 | Showed Up follow-up email | Low | n8n only |
| 2 | GCal event sync on status change | Medium | Supabase schema, n8n (2 workflows) |
| 3 | PT selection — end-to-end | High | Booking form, calendar API, n8n, admin dashboard |

**Pre-flight (before anything else):** Remove the dead "Trigger SMS" button from PatientTable row actions.

---

## Pre-flight — Remove Trigger SMS

**File:** `src/lib/components/admin/PatientTable.svelte`

Remove `{ Icon: MessageSquare, label: 'Trigger SMS' }` from the `rowActions` array and the
`MessageSquare` import. No backend changes needed.

---

## Phase 1 — Showed Up Follow-up

**Goal:** When an admin marks a lead as "Showed Up", automatically send the patient a
post-appointment email (thank you + rebook prompt + referral ask).

### What currently happens

`update-status/+server.js` fires `POST /webhook/kimut-status-update` with `{ email, new_status }`.
The n8n status-update workflow receives this and syncs Google Sheets. That's it — no "Showed Up"
branch exists.

### Changes

**SvelteKit — `src/routes/admin/update-status/+server.js`**

No changes needed to the server. The existing payload `{ email, new_status }` is enough — n8n
can branch on `new_status === 'Showed Up'` without modifying the webhook call.

**n8n — extend "Kimut Clinic – Status Update" workflow**

After the Google Sheets sync node, add a branch:
```
IF new_status === 'Showed Up'
  → Gmail – Showed Up Thank You
      To: {{ email }}
      Subject: Thank you for visiting Kimut Clinic, {{ name }}
      Body: personalized thank you, link to rebook, referral ask
```

To get the patient's name, add a Supabase HTTP GET node before the Gmail node:
```
GET /rest/v1/patient_leads?email=eq.{{ email }}&select=full_name,service,assigned_pt
```

**Email content outline:**
- Thank you message (personalized with first name + service)
- "How did we do?" — link to Google Form or simple reply
- Rebook prompt — link to the assessment form
- "Refer a friend" — forward the booking link

### Verify
- Mark a test lead as "Showed Up" in the admin dashboard
- Confirm email received with correct name/service
- Confirm the Sheets sync still works for other statuses

---

## Phase 2 — Google Calendar Event Sync on Status Change

**Goal:** When a lead moves to No Show or Lost (or is cancelled), delete or cancel the
corresponding Google Calendar event so the PT's calendar stays clean. Optionally, update the
event title when status changes to Confirmed.

### Current state

The n8n Intake Funnel creates a GCal event on booking but:
1. The event ID is **not saved back to Supabase** — it's lost after the workflow run
2. The status-update workflow has no GCal step at all

### Changes

#### 2a — Supabase schema

Add one column to `patient_leads`:

```sql
ALTER TABLE patient_leads ADD COLUMN gcal_event_id TEXT;
```

Run this in Supabase Dashboard → SQL Editor (or via MCP).

#### 2b — n8n Intake Funnel — save GCal event ID back to Supabase

After the "Google Calendar – Create Booking" node, add:

```
HTTP Request — PATCH Supabase patient_leads
  URL:   {{ SUPABASE_URL }}/rest/v1/patient_leads?id=eq.{{ lead_id }}
  Method: PATCH
  Headers: apikey, Authorization, Content-Type, Prefer: return=minimal
  Body:  { "gcal_event_id": "{{ $('Google Calendar – Create Booking').item.json.id }}" }
```

The `lead_id` is already available in the workflow payload from the webhook body. The GCal node
returns `id` in its output, which is the event ID.

#### 2c — n8n status-update workflow — GCal branch

In the "Kimut Clinic – Status Update" workflow, after the Sheets sync, add:

```
IF new_status === 'No Show' OR new_status === 'Lost'
  → HTTP Request — GET patient_leads gcal_event_id
      GET /rest/v1/patient_leads?email=eq.{{ email }}&select=gcal_event_id,assigned_pt
  → IF gcal_event_id exists
      → Google Calendar – Delete Event
          Calendar ID: determined by assigned_pt (see PT calendar map in Phase 3)
          Event ID: {{ gcal_event_id }}

IF new_status === 'Confirmed'
  → HTTP Request — GET patient_leads gcal_event_id
  → IF gcal_event_id exists
      → Google Calendar – Update Event
          Change title prefix to [CONFIRMED]
          (Optional — low priority, can skip initially)
```

#### Google Calendar credentials scope

The current service account in the SvelteKit calendar-availability API has `calendar.readonly`
scope. The n8n Google Calendar node uses OAuth credentials — confirm n8n's GCal credential has
write access (`calendar.events`). If using a service account in n8n, the key needs
`https://www.googleapis.com/auth/calendar.events` scope.

#### Note on multi-PT calendars

Phase 2 can ship with a single calendar (the existing `GOOGLE_CALENDAR_ID`). When Phase 3
introduces per-PT calendars, the Delete/Update node will need to know which calendar the event
is on. To future-proof: also store `gcal_calendar_id` in Supabase alongside `gcal_event_id`,
so the delete node doesn't need to reconstruct which PT's calendar to target.

```sql
ALTER TABLE patient_leads ADD COLUMN gcal_calendar_id TEXT;
```

The Intake Funnel can save this too: it knows which calendar it booked into.

### Verify
- Book a test lead → check Supabase that `gcal_event_id` and `gcal_calendar_id` are populated
- Mark that lead as "No Show" in admin → check GCal that the event is gone
- Mark another lead as "Lost" → same check
- Other status changes (Booked → Confirmed, etc.) should not affect GCal

---

## Phase 3 — PT Selection (End-to-End)

**Goal:** Patients choose a physical therapist (or pick "No preference") during booking.
Availability checking becomes PT-specific. The admin dashboard gains per-PT views and staff
can manage each PT's patients and schedule.

### Current state

- `assigned_pt` column exists in `patient_leads` (`reyes | santos | dizon`) but is admin-set
- One shared Google Calendar ID (`GOOGLE_CALENDAR_ID`) for all availability
- Assessment form has no PT selection step
- Admin table does not show `assigned_pt`
- Availability API has no per-PT concept

### Architecture decision — one calendar per PT

Each PT gets their own Google Calendar. The env file maps PT slugs to calendar IDs:

```
GOOGLE_CALENDAR_ID_REYES=...
GOOGLE_CALENDAR_ID_SANTOS=...
GOOGLE_CALENDAR_ID_DIZON=...
```

The existing `GOOGLE_CALENDAR_ID` (shared) can be kept as a fallback or removed. The Intake
Funnel's n8n GCal node already supports targeting a specific calendar ID — just needs the right
one routed per PT.

---

### 3a — Booking form: add PT selection step

**File:** `src/lib/components/funnel/KimutAssessment.svelte`

**New step order (7 steps total):**
1. What brings you in? (concern)
2. How long & how bad?
3. Tell us about you
4. Pick a service
5. **Choose your therapist** ← NEW (step 5)
6. Pick a slot ← now PT-aware
7. Review & submit

**Step 5 UI:**
- 4 cards: Reyes, Santos, Dizon, "No Preference"
- Each PT card shows: name, short specialty tagline, photo (if available) or initials avatar
- "No preference" card: neutral icon, "We'll match you to the first available therapist"
- Tapping a card advances to step 6 immediately (same UX as concern/service steps)

**formData additions:**
```js
let formData = $state({
  // existing fields...
  preferred_pt: '',   // 'reyes' | 'santos' | 'dizon' | 'any'
});
```

**Step 6 (slot picker) changes:**
- Pass `pt` param to calendar API: `/api/calendar-availability?date=...&pt={{ preferred_pt }}`
- If `preferred_pt === 'any'`, API returns combined availability (slot free if any PT is free)
- `totalSteps` increases from 6 to 7; progress bar and step logging update accordingly

**Step 7 (review) additions:**
- Show selected PT in the summary (or "No preference — auto-assigned" if `any`)

**Submit payload:**
- `preferred_pt` is included in the JSON sent to `/api/submit-assessment`

---

### 3b — API: calendar availability per PT

**File:** `src/routes/api/calendar-availability/+server.js`

**New query param:** `pt` — one of `reyes | santos | dizon | any`

**Single date (`?date=...&pt=reyes`):**
- Use `GOOGLE_CALENDAR_ID_REYES` instead of `GOOGLE_CALENDAR_ID`
- Supabase booking query also filters: `.eq('assigned_pt', 'reyes')`

**Single date (`?date=...&pt=any` or no `pt` param):**
- Query all 3 PT calendars in parallel (3 GCal freeBusy calls, can batch into one freeBusy request with multiple `items`)
- Supabase: query all `patient_leads` for that date (no PT filter)
- A slot is **available** if at least one PT has it free
- Return: `{ booked_slots, fully_booked, per_pt: { reyes: [...], santos: [...], dizon: [...] } }`
  - `per_pt` is used during auto-assignment on submit (frontend doesn't display it, but submit-assessment API uses it)

**Month view (`?month=...&pt=reyes`):** same logic, PT-filtered

**Env changes:**
- Add `GOOGLE_CALENDAR_ID_REYES`, `GOOGLE_CALENDAR_ID_SANTOS`, `GOOGLE_CALENDAR_ID_DIZON`
- Keep `GOOGLE_CALENDAR_ID` as a fallback for the Retell voice flow until that's updated

---

### 3c — Submit assessment API: auto-assign PT

**File:** `src/routes/api/submit-assessment/+server.js`

**Current behavior:** Sends to n8n with the form payload. `assigned_pt` is not set by the form.

**New behavior:**
- If `preferred_pt` is `reyes | santos | dizon`, pass it directly as `assigned_pt`
- If `preferred_pt === 'any'`:
  - Re-check availability for the chosen `datetime` across all 3 PTs (call calendar API internally or inline)
  - Pick the PT with the fewest Booked/Confirmed leads that day as a tiebreaker
  - Set `assigned_pt` to the resolved PT
- Pass `assigned_pt` in the n8n webhook payload

---

### 3d — n8n Intake Funnel: route GCal to correct PT's calendar

**Workflow: Kimut Clinic – Intake Funnel**

After the "Supabase – Insert Patient" node, add a Switch node:

```
Switch on assigned_pt:
  Case 'reyes'   → Google Calendar – Create Booking (Calendar: REYES_CAL_ID)
  Case 'santos'  → Google Calendar – Create Booking (Calendar: SANTOS_CAL_ID)
  Case 'dizon'   → Google Calendar – Create Booking (Calendar: DIZON_CAL_ID)
```

Each branch merges back into the existing "Merge (Wait for All)" node.

Alternatively, if n8n supports dynamic calendar IDs via expressions, use a single GCal node
with `{{ calendarIdMap[assigned_pt] }}` — cleaner but requires verifying expression support in
the GCal node's calendar field.

After creating the event, save `gcal_event_id` and `gcal_calendar_id` back to Supabase (from Phase 2b).

---

### 3e — Admin dashboard: PT column and filter

**Files:** `src/lib/components/admin/PatientTable.svelte`, `src/routes/admin/+page.svelte`

#### PatientTable changes

1. **New column: Assigned PT**
   - After the "Patient" column, add an "Assigned PT" cell
   - Show a small pill with the PT's last name: `Reyes`, `Santos`, `Dizon`, or `—` if null
   - Color-code each PT consistently (e.g., Reyes=blue, Santos=green, Dizon=amber)

2. **PT filter pills (second row of toolbar)**
   - Add a second filter dimension: `All PTs | Reyes | Santos | Dizon | Unassigned`
   - Composable with the existing status filter (patient must match both)
   - Bind to a new `$state` variable `filterPT`

3. **`processedLeads` derived update**
   - Add PT filter condition alongside the existing status and search filters

4. **Reassign PT inline** (optional, post-launch)
   - The row action "Edit Details" (still in the UI) could open a modal that allows changing `assigned_pt`

#### MetricCards changes (optional)

Add a fourth row or section: **PT Workload** — count of active (Booked + Confirmed) leads per PT
shown as 3 mini bars or a simple count grid. Helps staff see who's overloaded.

---

### 3f — Admin dashboard: PT Schedule view

**Files:** `src/lib/components/admin/SideNav.svelte`, new `src/lib/components/admin/PTSchedule.svelte`

Add a third nav item: **PT Schedules** (calendar icon).

**PTSchedule view:**
- Week view (Mon–Sat) showing the current week by default, with prev/next week navigation
- Three columns, one per PT (Reyes | Santos | Dizon), each showing their Confirmed appointments for each day
- Each appointment card shows: time, patient name, service
- Click an appointment → opens the same patient details modal as the table

**Data source:** Derived from the existing `leads` array (already loaded), filtered by `assigned_pt`
and `datetime_parsed`. No additional API call needed — all data is in memory.

**Status visibility:** Only show Booked + Confirmed in the schedule (Showed Up / No Show / Lost
are historical, not upcoming).

---

---

## Implementation order

| Step | What | Who | Status |
|---|---|---|---|
| Pre-flight | Remove Trigger SMS from PatientTable | Code | ✅ Done |
| 1 | Phase 1: Showed Up follow-up | n8n | ⏳ Pending |
| 2 | Phase 2: Add `gcal_event_id` + `gcal_calendar_id` columns to Supabase | DB | ⏳ Pending |
| 3 | Phase 2: n8n Intake Funnel — save GCal event ID | n8n | ⏳ Pending |
| 4 | Phase 2: n8n status-update — GCal delete on No Show/Lost | n8n | ⏳ Pending |
| 5 | Phase 3a: Form PT selection step (step 5, update totalSteps) | Code | ✅ Done |
| 6 | Phase 3b: Calendar API per-PT support | Code | ✅ Done |
| 7 | Phase 3c: Submit-assessment auto-assign PT | Code | ✅ Done |
| 8 | Phase 3d: n8n Intake Funnel route GCal per PT | n8n | ⏳ Pending |
| 9 | Phase 3e: Admin table PT column + PT filter pills | Code | ✅ Done |
| 10 | Phase 3f: Admin PT Schedule view | Code | ✅ Done |

---

## What was shipped (2026-05-25)

### Bug fixes

- **Supabase — `patient_leads` missing columns** — Assessment submissions were failing with *"Could not find the 'assigned_pt' column in the schema cache"*. Added 4 missing columns via migration:
  ```sql
  ALTER TABLE public.patient_leads
    ADD COLUMN IF NOT EXISTS assigned_pt text,
    ADD COLUMN IF NOT EXISTS additional_notes text,
    ADD COLUMN IF NOT EXISTS session_id text,
    ADD COLUMN IF NOT EXISTS calendar_id text;
  ```

- **n8n — Availability Check workflow rebuilt** (`Kimut Clinic – Availability Check`) — The workflow was hardcoded to one shared calendar and had no `pt` param support, so the voice agent always got wrong/empty availability data. Rebuilt to:
  - **`Normalize Date`** (POST/Retell path) — now also extracts `pt` from `body.args.pt` or `body.pt`
  - **`Map PT Date`** (new Code node) — consolidates `pt` + `date` from either the GET or POST path into a single item
  - **`GCal Reyes` / `GCal Santos` / `GCal Dizon`** (3 parallel GCal nodes) — each queries the correct PT-specific calendar; fan-out from `Map PT Date`
  - **`Merge Events`** (new Merge node) — waits for all 3 GCal queries to complete
  - **`Code - Calculate Available Slots`** (updated) — per-PT logic:
    - Specific PT (`?pt=reyes`): slot booked if *that* PT has an event at that hour
    - Any/no PT: slot booked only if *all 3 PTs* are busy (available if ≥1 PT is free)
  - Retell (POST path) and GET path both supported; both now pass `pt` through correctly

---

## What was shipped (2026-05-24)

### Code changes
- **`src/lib/gcal.js`** (new) — shared Google Calendar utility: `getGoogleAccessToken`, `getGoogleBusy`, `getGoogleBusyBatch`. Imported by both the calendar API and submit-assessment.
- **`src/routes/api/calendar-availability/+server.js`** — accepts `?pt=reyes|santos|dizon|any`. Single-PT queries use that PT's specific calendar + filter Supabase by `assigned_pt`. `any` queries all 3 calendars in one batch freeBusy call — a slot is only grayed out if ALL 3 PTs are busy. Month view follows same logic.
- **`src/routes/api/submit-assessment/+server.js`** — resolves `assigned_pt` before sending to n8n. Specific PT → pass through directly. `any` → check GCal free/busy per PT for the chosen slot, tiebreak by fewest Booked+Confirmed leads that day.
- **`src/lib/components/funnel/KimutAssessment.svelte`** — new step 5 (PT selection cards: Reyes, Santos, Dizon, No Preference). `totalSteps` bumped to 7. Slot picker → step 6, review → step 7. Selecting a PT resets the date/month cache so step 6 re-fetches with the correct PT. Review summary shows chosen therapist. `preferred_pt` included in submit payload.
- **`src/lib/components/admin/PatientTable.svelte`** — removed SMS button + import. New "Assigned PT" column with color-coded pills (Reyes=blue, Santos=green, Dizon=amber). PT filter row (All PTs / Reyes / Santos / Dizon / Unassigned) composable with status filter and search. `colspan` updated to 7.
- **`src/lib/components/admin/PTSchedule.svelte`** (new) — week view Mon–Sat, 3 PT columns, showing Booked+Confirmed appointments. Prev/next week navigation + "Today" reset. Derives from in-memory `leads` array — no extra API call.
- **`src/lib/components/admin/SideNav.svelte`** — added "PT Schedules" nav item (CalendarDays icon).
- **`src/routes/admin/+page.svelte`** — wired `PTSchedule` into the `schedules` activeView branch.

### Env / config
- `GOOGLE_CALENDAR_ID_REYES`, `GOOGLE_CALENDAR_ID_SANTOS`, `GOOGLE_CALENDAR_ID_DIZON` added to `.env`.
- All 3 calendars shared with `kimut-clinic-service-account@kimutclinic.iam.gserviceaccount.com`.

---

## What still needs to be done

### Phase 1 — Showed Up follow-up (n8n only)
In the "Kimut Clinic – Status Update" n8n workflow, after the Google Sheets sync node, add:
```
IF new_status === 'Showed Up'
  → Supabase HTTP GET: /rest/v1/patient_leads?email=eq.{{ email }}&select=full_name,service,assigned_pt
  → Gmail – Showed Up Thank You
      To: {{ email }}
      Subject: Thank you for visiting Kimut Clinic, {{ full_name }}
      Body: thank you + rebook link + referral ask
```

### Phase 2a — Supabase schema (DB)
Run in Supabase Dashboard → SQL Editor:
```sql
ALTER TABLE patient_leads ADD COLUMN gcal_event_id TEXT;
ALTER TABLE patient_leads ADD COLUMN gcal_calendar_id TEXT;
```

### Phase 2b — n8n Intake Funnel: save GCal event ID (n8n)
After the "Google Calendar – Create Booking" node (each branch), add an HTTP PATCH back to Supabase:
```
PATCH /rest/v1/patient_leads?id=eq.{{ lead_id }}
Body: { "gcal_event_id": "{{ $('Google Calendar').item.json.id }}", "gcal_calendar_id": "{{ calendarId }}" }
```

### Phase 2c — n8n status-update: GCal delete on No Show/Lost (n8n)
In "Kimut Clinic – Status Update" workflow, after Sheets sync, add:
```
IF new_status === 'No Show' OR 'Lost'
  → Supabase GET: fetch gcal_event_id + gcal_calendar_id for this lead
  → IF gcal_event_id exists
      → Google Calendar – Delete Event (calendar: gcal_calendar_id, event: gcal_event_id)
```

### Phase 3d — n8n Intake Funnel: route GCal to correct PT calendar (n8n)
After "Supabase – Insert Patient" node, add a Switch on `assigned_pt`:
```
Case 'reyes'  → Google Calendar – Create Booking (Calendar: REYES_CAL_ID)
Case 'santos' → Google Calendar – Create Booking (Calendar: SANTOS_CAL_ID)
Case 'dizon'  → Google Calendar – Create Booking (Calendar: DIZON_CAL_ID)
```
After each branch creates the event, save `gcal_event_id` + `gcal_calendar_id` back to Supabase (Phase 2b).
Merge all branches back into the existing Merge node.

The calendar IDs to use in n8n:
- Reyes: `19bf492259ecb98bf8324ec4ff65788821f82229f09a768c8f11a3d8e8338c69@group.calendar.google.com`
- Santos: `0545736dad12c8662e85245cb28dcbeb8e013326ccb4cd9e42e154a1534560d5@group.calendar.google.com`
- Dizon: `970d3a33218e91b9d8505e1649b80f17e6ad5da88718ae44742d5016f813638e@group.calendar.google.com`

---

## New env vars required

| Key | Used by | Status |
|---|---|---|
| `GOOGLE_CALENDAR_ID_REYES` | calendar API, n8n | ✅ Added to `.env` |
| `GOOGLE_CALENDAR_ID_SANTOS` | calendar API, n8n | ✅ Added to `.env` |
| `GOOGLE_CALENDAR_ID_DIZON` | calendar API, n8n | ✅ Added to `.env` |

The existing `GOOGLE_CALENDAR_ID` remains as a fallback for Retell.

---

## Decisions (resolved)

1. **PT profiles:** Photos only for now — no bios or specialty taglines. Each PT card shows their photo and name. If a photo isn't available, fall back to initials avatar. *(Implemented with initials avatars.)*

2. **"No preference" tie-break:** When multiple PTs are free for the chosen slot, assign to whichever PT has the **fewest Booked + Confirmed leads on that day**.

3. **Existing leads with no `assigned_pt`:** Treat all existing `null` rows as "Unassigned" / no preference in the admin table. These are test data and will be deleted manually — no migration or backfill needed.

4. **Google Calendars per PT:** ✅ Created. All 3 shared with the service account. IDs added to `.env`.

5. **Retell voice agent:** PT selection will **not** be added to the Retell flow now. The n8n Availability Check workflow (used by Retell) now queries all 3 PT calendars and correctly reports "any" availability (slot available if ≥1 PT is free). Retell can also pass `pt` in the POST body if per-PT queries are needed in future.
