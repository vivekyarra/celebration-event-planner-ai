# CelebriteAI - Autonomous Celebration & Event Planner Assistant

[![Deploy CelebriteAI to GitHub Pages](https://github.com/vivekyarra/celebration-event-planner-ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/vivekyarra/celebration-event-planner-ai/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Vitest-Passing-brightgreen?logo=vitest)](https://vitest.dev/)

> **PW Virtual Hackathon / Hack2skill — [Challenge 5] Celebration & Event Planner**  
> An autonomous, context-aware celebration orchestrator and dynamic copilot powered by Google Gemini AI.

---

## 🌟 Live Deployment & Links
- **Live Application URL**: [https://vivekyarra.github.io/celebration-event-planner-ai/](https://vivekyarra.github.io/celebration-event-planner-ai/)
- **Public GitHub Repository**: [https://github.com/vivekyarra/celebration-event-planner-ai](https://github.com/vivekyarra/celebration-event-planner-ai)
- **Repository Branch**: Single Branch (`main`)
- **Repository Size**: Under 1 MB (Strict rule: < 10 MB)

---

## 🎯 1. Chosen Vertical & Persona
- **Chosen Challenge**: `[Challenge 5] Celebration & Event Planner`
- **Solution Persona**: Master Event Concierge & Autonomous Logistics Director.
- **Problem Context**: Modern celebration planning (weddings, hackathons, milestone birthdays, corporate galas, anniversaries) is plagued by budget misallocations, disjointed schedules, dietary oversights, chaotic guest RSVPs, and vendor miscommunication.
- **The Solution**: CelebriteAI synthesizes all celebration dimensions into an intelligent, cohesive, interactive workspace with instant algorithmic adjustments, live context-driven recommendations, and an integrated AI copilot.

---

## 🧠 2. Approach and Logic

CelebriteAI applies domain-grounded heuristics combined with Gen AI intelligence across six critical pillars:

```
                          ┌────────────────────────┐
                          │   CelebriteAI Engine   │
                          └───────────┬────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
┌──────▼───────┐              ┌───────▼────────┐             ┌───────▼──────┐
│ Dynamic      │              │ Chronological  │             │ Theme &      │
│ Budget       │              │ Run-of-Show    │             │ Creative     │
│ Allocator    │              │ Generator      │             │ Studio       │
└──────┬───────┘              └───────┬────────┘             └───────┬──────┘
       │                              │                              │
┌──────▼───────┐              ┌───────▼────────┐             ┌───────▼──────┐
│ Culinary &   │              │ Live RSVP &    │             │ Vendor RFP   │
│ Dietary Menu │              │ Seating Matrix │             │ Tracker      │
└──────────────┘              └────────────────┘             └──────────────┘
```

1. **Context-Driven Budget Allocation**:
   - Calculates custom category breakdowns depending on celebration vertical (e.g., weddings emphasize venue/decor 35%/15%, while hackathons emphasize high-bandwidth tech/facilities 30% and continuous energy catering 30%).
   - Dynamic real-time sliders allow fine-tuned percentage balancing with automatic over-budget and under-budget alerts.
   - Calculates real-time unit economics (Cost per Attendee).

2. **Master Run-of-Show & Timeline**:
   - Synthesizes minute-by-minute execution milestones categorized across 6 phases (`setup`, `arrival`, `ceremony`, `dining`, `entertainment`, `winddown`).
   - Integrated lead coordinator assignment and milestone completion toggles.
   - 1-click export to iCalendar (`.ics`) format for seamless sync with Google Calendar and Apple Calendar.

3. **Curated Theme & Multi-Tone Invitation Studio**:
   - Algorithmic color harmony palette generation (Primary, Secondary, Accent, Background) with 1-click hex copying.
   - Tailored sensory guidance: lighting temperature, dress codes, and curated music playlists.
   - Ready-to-send invitations written in 4 distinct tones (*Elegant*, *Playful*, *Formal*, *Poetic*) with instant WhatsApp and Email dispatch triggers.

4. **Dietary-Aware Banquet Menu Planning**:
   - Structured courses (Starters, Mains, Desserts, Beverages) respecting strict dietary tags (Vegan, Jain, Halal, Gluten-Free, Nut-Free).
   - Dynamic portion sizing calculator scaled to guest count.

5. **RSVP & Seating Logistics Registry**:
   - Live KPI counters (Confirmed, Pending, Declined, Headcount including Plus-Ones).
   - Search by guest name, email, or dietary tag with instant status dropdown toggles.
   - 1-click CSV guest list export for catering and venue security teams.

6. **CelebriteBot Conversational Copilot**:
   - Interactive advisor powered by **Google Gemini 1.5 Flash API**.
   - Includes full offline fallback engine ensuring zero degradation when offline.
   - Pre-loaded quick prompt chips for budget pruning, weather contingencies, speeches, and timeline adjustments.

---

## 🛠️ 3. Gen AI Services Utilized & Implementation Details

| Gen AI Service | Model / Engine | Implementation Location | Purpose |
|----------------|----------------|--------------------------|---------|
| **Google Gemini API** | `gemini-1.5-flash` | `src/services/plannerGenerator.ts` (`queryEventCopilot`) | Contextual reasoning, natural language advising, creative theme ideation, and custom toast/invitation writing. |
| **Heuristic Fallback Engine** | Local Algorithmic AI | `src/services/plannerGenerator.ts` | High-speed, deterministic event calculation ensuring 100% functionality even without an API key or internet access. |

---

## 📊 4. Evaluation Focus Areas Compliance

### 1. Code Quality
- Clean, modular TypeScript architecture with strictly typed data interfaces (`src/types/index.ts`).
- Component isolation: separate presentation and business logic.
- Consistent code formatting and linting.

### 2. Security
- Zero hardcoded API keys or secrets in source code.
- Client-side storage of user-provided API keys in `localStorage` with explicit clear controls.
- Strict input sanitization preventing XSS attacks.
- Secure environment variable isolation via `.env.example`.

### 3. Efficiency & Performance
- Bundled with Vite 8 and React 19 for instantaneous hot-reloads and minimal overhead.
- Total production JavaScript bundle: **~99 kB gzipped**.
- Total repository footprint: **< 1 MB** (well below the 10 MB limit).
- Strict `.gitignore` preventing accidental repository bloat.

### 4. Testing
- Vitest unit and integration test suite (`src/test/planner.test.ts`, `src/test/components.test.tsx`).
- 100% test pass rate covering budget allocation algorithms, timeline synthesis, menu generation, copilot response matching, and UI accessibility.

### 5. Accessibility (A11y)
- Full WCAG 2.1 AA compliance:
  - Semantic HTML5 structure (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`).
  - High contrast color palette with accessible text ratios.
  - ARIA attributes (`aria-label`, `aria-selected`, `aria-modal`, `role="tab"`).
  - Full keyboard navigability with visible focus indicators.
  - Print-optimized CSS (`@media print`) for 1-click executive PDF dossier generation.

### 6. Problem Statement Alignment
- Specifically built for **[Challenge 5] Celebration & Event Planner**.
- Delivers practical, production-ready, real-world utility for real celebration planners, wedding coordinators, and corporate hackathon organizers.

---

##  Assumptions Made
1. **Currency Flexibility**: Default currency is USD, but the algorithmic budget ratios scale symmetrically to any target denomination (INR, EUR, GBP).
2. **Attendance Variability**: Heuristic allocations assume a 10-15% margin of buffer in catering and seating for plus-ones and unexpected attendees.
3. **Graceful Offline Capability**: While live GenAI queries utilize Gemini 1.5 Flash, the app is architected so that any evaluator without an API key gets a 100% rich interactive experience.

---

## 🚀 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/vivekyarra/celebration-event-planner-ai.git
cd celebration-event-planner-ai

# Install dependencies
npm install

# Run automated tests
npm test

# Launch local development server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
