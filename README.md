# NATS Messaging Example – Incidents & Instructions

This project shows how to use **NATS** as a messaging backbone for a simple backend and client.  
It demonstrates how to:

- Start a backend service that manages "incidents" and "instructions"
- Store data in **JetStream Key-Value (KV) buckets**
- Send **requests** and **commands** from a client
- Use **publish/subscribe** to receive live updates

The code is split into two parts:

- `server.ts` → our **backend service**
- `client.ts` → a **test client**

---

## 🔹 What is NATS?

NATS is a lightweight, high-performance messaging system. You can think of it as "email for programs":

- **Publish/Subscribe** → one service publishes a message, others subscribe to it.
- **Request/Reply** → one service asks a question, another replies.
- **JetStream** → NATS persistence layer, adds streams, key-value buckets, durable storage.

Some terms:
- **Subject** → like a topic/channel. Example: `data.get.incidents`
- **Wildcard subjects**  
  - `*` matches exactly **one** token (`commands.*` matches `commands.foo` but not `commands.foo.bar`).  
  - `>` matches **everything after** (`commands.>` matches `commands.foo`, `commands.foo.bar`, etc).

---

## 🔹 Backend (`server.ts`)

The backend connects to NATS, sets up storage, and listens for requests.

### 1. Connect to NATS
```ts
this.nc = await connect({ servers: 'nats://localhost:4222' });
this.js = this.nc.jetstream();
```

### 2. Setup JetStream
- Creates **streams** for event history (`incidents-events`, `instructions-events`).
- Connects to **KV buckets** for current state:
  - `incidents-current`
  - `instructions-current`
  - `app-kpis`

### 3. Seed Data
On startup, we store a few sample incidents and instructions in the KV buckets.

Example seeded incident:
```json
{
  "id": "INC-001",
  "title": "Network outage",
  "city": "New York",
  "severity": "high",
  "status": "open",
  "description": "Critical network infrastructure failure",
  "createdAt": "2025-09-22T12:00:00Z"
}
```

### 4. Handlers

The backend subscribes to three types of requests:

1. **Definition requests**  
   - Subject: `definitions.get.*`  
   - Example: `definitions.get.incidents`  
   - Loads JSON definitions from the `definitions/` folder.

2. **Data requests**  
   - Subject: `data.get.*`  
   - Example: `data.get.incidents` → returns all current incidents.  
   - Example: `data.get.instructions` → returns all instructions.

3. **Commands**  
   - Subject: `commands.>` (matches all commands).  
   - Example commands:
     - `commands.incident.acknowledge`  
     - `commands.incident.update`  
     - `commands.instruction.update`  

   Commands update KV data and publish **update events** (`incidents.updated`, `instructions.updated`).

---

## 🔹 Client (`client.ts`)

The client connects to NATS and runs tests:

### 1. Data Requests
```ts
const reply = await this.nc.request("data.get.incidents", sc.encode(""));
const incidents = JSON.parse(sc.decode(reply.data));
```
Prints all incidents currently stored.

### 2. Definition Requests
```ts
await this.nc.request("definitions.get.incidents", sc.encode(""));
```
Returns the JSON definition for the "incidents" module.

### 3. Commands
- **Acknowledge an incident**
```ts
this.nc.request("commands.incident.acknowledge", sc.encode(JSON.stringify({ id: "INC-001" })));
```
- **Update an incident**
```ts
this.nc.request("commands.incident.update", sc.encode(JSON.stringify({
  id: "INC-002",
  updates: { status: "resolved", description: "Issue fixed" }
})));
```

The client also subscribes to:
```ts
this.nc.subscribe("incidents.updated");
```
to receive real-time notifications about updates.

---

## 🔹 How the pieces fit together

```
+-------------+         request/reply         +-------------+
|   Client    | ----------------------------> |   Backend   |
|             | <---------------------------- |             |
|   requests  |          data/defs            |   responds  |
+-------------+                               +-------------+
       |                                              |
       |     publish/subscribe (events)               |
       v                                              v
   incidents.updated ----------------------------> other clients
```

- Client asks for data → Backend replies.
- Client sends a command → Backend updates KV → publishes an event.
- Any subscriber (including the client itself) can react to update events.

---

## 🔹 How to Run

1. Start a local NATS server:
   ```bash
   make up
   ```

2. Run the backend:
   ```bash
   npm run server
   ```

3. In another terminal, run the client:
   ```bash
   npm run client
   ```

Expected output:
- All incidents and instructions printed.
- Definitions loaded.
- Incident `INC-001` acknowledged, `INC-002` updated.
- Update events received in real time.

---


## NOTE

Makefile has other commands, explore them on your own!


# ASSIGNMENT

# 📝 Frontend Assignment – JSON-Driven UI with NATS

## Overview

This assignment is for a **Senior Frontend Developer** (Vue.js acceptable, React prefered).  
The goal is to build a **JSON-driven UI renderer** on top of an existing **NATS backend**.  

You will use the provided backend to fetch **data** and **view definitions**, then render them dynamically in the browser.  
The app should display and update **Incidents** and **Instructions** modules.

---

## 🎯 Requirements

### 1. Technologies
- **Vue 3** (preferred) or **React 18**  
- TypeScript  
- State management (e.g. **Zustand**)  ONLY Zustand is allowed
- NATS client (via [nats.ws](https://github.com/nats-io/nats.ws) for browser)

### 2. Features

#### a) Navigation
- A simple navigation bar with two entries:
  - **Incidents**
  - **Instructions**
- Clicking an entry switches the active module (only one visible at a time).

#### b) Definitions & Rendering
- Fetch a **view definition** from NATS (`definitions.get.incidents` or `definitions.get.instructions`).
- Render the UI **based on JSON definition**.  
  Example:
  ```json
  {
    "tag": "view",
    "name": "dashboard",
    "children": [
      { "tag": "text", "content": "Welcome to Incidents Dashboard", "level": 1 },
      { "tag": "table", "items": "incidents" }
    ]
  }
  ```

Supported components (at minimum):
- text → headings, paragraphs
- input / select → form fields
- card → container for details
- table → render collections (incidents or instructions)


#### c) Data Binding

- Fetch module data:
  - data.get.incidents
  - data.get.instructions

- Bind fetched data into rendered views (e.g. fill a table with incidents).


#### d) Commands

- Implement interactions that send commands back to backend:
	-	Acknowledge incident: commands.incident.acknowledge
	-	Update incident: commands.incident.update
-	After a command, the UI should update automatically when incidents.updated or instructions.updated events are published.


#### e) State

- Each module should keep its own store:
	- Store survives when switching modules.
	- Updates from NATS (events) update the store even if module UI is not mounted.

### 3. Nice-to-Have

- Live subscription to incidents.updated / instructions.updated.
- Input validation from JSON schema (required, readonly, etc.).


## Questions you might have

- is nats working in browser?  
  → yes, use nats.ws package
- how to test?
  → see client.ts or use wscat to send commands
- how to run nats server?
  → see README.md, use `make up` to start a local nats server
- where to find definitions?
  → in `definitions/` folder
- why i must use Zustand, and not Pinia or Redux?
  → because Zustand is purejs, works in both Vue and React, and is very simple to use
- can i use Vue 2 or React 17?
  → sure, no problem
- how can i keep the state when switching modules?
  → use Zustand, it is a global store
- how to test if the state is kept?
  → switch modules, then send a command via wscat, then switch back and see if the state is updated
- can i use any UI library?
  → yes, but keep it simple. Note, that 3rd party UI libs, may prove difficult to render dynamically from JSON
- can i use any build tool?
  → yes, use Vite, Webpack, etc.
- can i change the backend if it helps/ there is bug/ i want to add feature?
  → yes, but keep it minimal, and inform me
- Do I need to implement authentication?
  → No. Authentication is not part of this assignment. The NATS server is local and open.
- How complex should the JSON renderer be?
  → Start small (text, table, input, card, select). It doesn’t have to cover every possible component, but it should be structured so new types could be added easily.
- What about layout (grid, flex, etc.)?
  → You don’t need to design a layout system. Simple vertical stacking is fine.
- Should the UI be pixel-perfect or styled nicely?
  → No need for pixel-perfect CSS. Keep it readable, minimal styling is enough.
- How large can the data be?
  → For this test, data is small (a handful of incidents/instructions). Your solution should not assume huge datasets, but avoid obvious inefficiencies.
- Should I cache definitions or data on the frontend?
  → It’s up to you. For simplicity, you can fetch on navigation change. Bonus points if you add caching + event-driven updates.
- What should I do if a definition or data request fails?
  → Show a simple error message in the UI (e.g., “Failed to load incidents”).
- Do I need to support editing or forms in detail view?
  → Only to the extent required to demonstrate sending a command (acknowledge or update).
- Do I need to persist state across browser reloads?
  → No, in-memory is enough.