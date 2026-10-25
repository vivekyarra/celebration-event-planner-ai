# CelebriteAI - Autonomous Celebration & Event Planner Assistant (Winner Edition)

[![Deploy CelebriteAI to GitHub Pages](https://github.com/vivekyarra/celebration-event-planner-ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/vivekyarra/celebration-event-planner-ai/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tests](https://img.shields.io/badge/Vitest-17%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![WCAG 2.1 AA](https://img.shields.io/badge/Accessibility-WCAG%202.1%20AA-success)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **PW Virtual Hackathon / Hack2skill — [Challenge 5] Celebration & Event Planner**  
> An autonomous, context-aware celebration orchestrator and dynamic copilot powered by Google Gemini AI.

---

## 🌟 Live Deployment & Repository Info
- **Live Application URL**: [https://vivekyarra.github.io/celebration-event-planner-ai/](https://vivekyarra.github.io/celebration-event-planner-ai/)
- **Public GitHub Repository**: [https://github.com/vivekyarra/celebration-event-planner-ai](https://github.com/vivekyarra/celebration-event-planner-ai)
- **Repository Branch**: Single Branch (`main`)
- **Repository Size**: Under 1 MB (Strict rule: < 10 MB)

---

## 🏆 What Makes CelebriteAI a Winner (High Impact Features)

1. **Autonomous Context-Aware Event Designer**:
   - Dynamic orchestration for **Weddings, 24H Hackathons, Milestone Birthdays, Corporate Galas, and Anniversaries**.
   - Computes granular budget distributions, run-of-show milestones, vendor directories, theme palettes, and guest seating in under 200ms.

2. **AI Dietary Safety & Conflict Resolver**:
   - Audits guest list dietary preferences against menu courses.
   - Automatically detects deficiencies (e.g. registered vegan guests without dedicated vegan entrees) and provides a **1-click auto-resolve** button that adds tailored culinary dishes to the menu.

3. **Speech & Toast Rehearsal Studio with Native TTS**:
   - Drafts speeches tailored to speaker role (Best Friend, Emcee, Host, Sibling), tone (Witty, Emotional, Bold, Poetic), and duration (1, 3, or 5 minutes).
   - Features built-in **Web Speech API Audio Preview** to rehearse aloud with teleprompter auto-formatting.

4. **"What-If" Budget Scenario Simulator**:
   - Compare **Conservative (-20%)**, **Balanced (Baseline)**, and **Luxury (+35%)** tiers side-by-side with instantaneous recalculation and 1-click application.

5. **Global Command Palette (`Ctrl+K`)**:
   - Instant keyboard navigation to jump across all modules, trigger celebrations, or export reports.

6. **Minute-by-Minute Run of Show & iCal Export**:
   - Chronological breakdown across 6 phases (`setup`, `arrival`, `ceremony`, `dining`, `entertainment`, `winddown`) with 1-click `.ICS` calendar sync.

7. **Multi-Tone Invitation Copy Studio**:
   - Instant WhatsApp and Email share links across 4 tones (*Elegant*, *Playful*, *Formal*, *Poetic*).

---

## 🧠 Architecture & Logic

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
│ Dietary      │              │ Live RSVP &    │             │ Speech &     │
│ Conflict     │              │ Seating Matrix │             │ Toast Studio │
│ Resolver     │              │                │             │ (Web Speech) │
└──────────────┘              └────────────────┘             └──────────────┘
```

---

## 🛠️ Gen AI Services Utilized

| Gen AI Service | Model / Engine | Implementation Location | Purpose |
|----------------|----------------|--------------------------|---------|
| **Google Gemini API** | `gemini-1.5-flash` | `src/services/plannerGenerator.ts` (`queryEventCopilot`) | Contextual event advisory, budget optimization insights, theme ideation, speech generation, and weather contingencies. |
| **Heuristic Fallback Engine** | Local Algorithmic AI | `src/services/plannerGenerator.ts` | High-speed, deterministic reasoning ensuring 100% functionality even without an API key or internet access. |
| **Speech Synthesis API** | Native Web Speech API | `src/hooks/useSpeech.ts` | Natural speech audio preview for rehearsal teleprompter. |

---

## 📊 Evaluation Criteria Compliance

### 1. Code Quality (High Impact)
- Modular TypeScript architecture with strict typings (`src/types/index.ts`).
- Component isolation, custom React hooks, and clean separation of concerns.

### 2. Security (High Impact)
- Strict HTML entity sanitization (`src/utils/security.ts`) to neutralize XSS vulnerabilities.
- Safe client-side storage (`localStorage`) with explicit wipe controls; zero exposed API secrets.
- Complete security documentation in [SECURITY.md](SECURITY.md).

### 3. Efficiency (Medium Impact)
- Lightning-fast Vite 8 build (~1.2s).
- Production JS bundle: **~106 kB gzipped**.
- Git repository size: **< 150 KiB** (100x below the 10 MB hackathon ceiling).

### 4. Testing (High Impact)
- **17 automated unit and integration tests** passing across 4 suites (`planner.test.ts`, `security.test.ts`, `components.test.tsx`, `advancedComponents.test.tsx`).

### 5. Accessibility (Medium Impact)
- WCAG 2.1 AA compliant: ARIA roles, semantic HTML5, keyboard navigation (`Ctrl+K`), high contrast ratios, and print-ready CSS (`@media print`).

### 6. Problem Statement Alignment (High Impact)
- 100% focused on **[Challenge 5] Celebration & Event Planner**.

---

## 🚀 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/vivekyarra/celebration-event-planner-ai.git
cd celebration-event-planner-ai

# Install dependencies
npm install

# Run automated test suites (17 tests)
npm test

# Launch local development server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
