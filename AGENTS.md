# AGENTS.md - Jarvis Home OS

## Runbook
| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the built app |
Notes: no tests or lint tasks are configured.

## Environment and secrets
- `API_KEY`: expected by `useGeminiLive` for Google Gemini access. Put it in `.env.local`.
- `.env.local` currently ships with `GEMINI_API_KEY`, but that variable is not read by the app; align before shipping.
- App runs in the browser and requests microphone permission.

## Project summary
React 19 + TypeScript + Vite voice-first UI for a home OS. The app streams microphone audio to Gemini Live (native audio model), renders a voice orb state machine, and opens side surfaces (Shopping, Agenda, News) via tool calls.

## File map
```
jarvis-home-os/
|-- components/
|   |-- VoiceOrb.tsx            # Visualizes connection/listening/speaking states
|   |-- SurfaceManager.tsx      # Renders the active surface with slide-in panel
|   |-- surfaces/
|       |-- ShoppingSurface.tsx
|       |-- AgendaSurface.tsx
|       |-- NewsSurface.tsx
|-- services/
|   |-- geminiLive.ts           # Gemini Live hook: WebSocket, audio I/O, tool calls
|-- utils/
|   |-- audioUtils.ts           # PCM encode/decode helpers
|-- App.tsx                     # Shell UI with connect toggle and orb
|-- store.ts                    # Zustand store (state + actions)
|-- types.ts                    # Enums and interfaces
|-- constants.ts                # System prompt + mock data
|-- index.tsx                   # Entry point
|-- index.html                  # Tailwind CDN setup and fonts
```

## Core flows
- Connection: header button calls `useGeminiLive.connect/disconnect`; manages AudioContexts (16 kHz input, 24 kHz output) and mic permissions.
- Input streaming: ScriptProcessorNode performs simple RMS VAD, converts Float32 -> PCM16 -> base64, and sends via `session.sendRealtimeInput`.
- Output playback: decodes inline audio, queues BufferSources to avoid gaps, updates speaking flag when queue drains.
- Tools exposed to the model: `updateSurface(surface: SHOPPING|AGENDA|NEWS|NONE)` toggles UI; `addShoppingItem(item: string)` appends to list and opens Shopping surface.
- System instruction mentions `checkTime` but no such tool is registered; add it to `tools` and store if needed.
- Transcripts: buffered per turn; store keeps the last five messages (`addTranscriptMessage`).

## State (useJarvisStore)
Shape: `isConnected`, `isSpeaking`, `isListening`, `activeSurface`, `shoppingList`, `agenda`, `news`, `transcript`. Actions: `setConnected`, `setIsSpeaking`, `setIsListening`, `setActiveSurface`, `addShoppingItem`, `toggleShoppingItem`, `addTranscriptMessage`.

## UI surfaces
- ShoppingSurface: toggle items; shows optional price estimate; footer shows mock sync/total.
- AgendaSurface: vertical timeline; meetings show a location chip.
- NewsSurface: card grid with hero image; uses remote placeholder images.

## Styling and conventions
- Tailwind via CDN in `index.html` with custom animations (`spin-slow`, `pulse-slow`, `ping-slow`); font: Inter.
- Path alias `@/*`; React FCs with hooks; Zustand for state; inline Tailwind classes for styling.
- Naming: camelCase for vars/functions, PascalCase for components/enums/interfaces. Avoid comments unless code is complex.

## Gaps and cautions
- Environment var mismatch (`API_KEY` vs `GEMINI_API_KEY`) will block connectivity until unified.
- Some mock strings in `constants.ts`/`store.ts` are Latin-1 encoded (e.g., Cafe, Reuniao) and may need cleanup.
- No tests or type-level runtime guards around streaming; AudioWorklet could replace ScriptProcessorNode for production.
