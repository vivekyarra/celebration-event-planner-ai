# Security Policy & Implementation

CelebriteAI adheres to industry security standards for client-side applications and GenAI integration.

## 1. Threat Modeling & Safeguards

| Threat Vector | Mitigation Strategy | Implementation Location |
|---|---|---|
| **Cross-Site Scripting (XSS)** | String sanitization and HTML entity encoding before rendering user-submitted titles, notes, or guest details. | `src/utils/security.ts` (`sanitizeHtml`) |
| **API Secret Exposure** | Zero hardcoding of API secrets. Gemini API keys are held exclusively client-side in `localStorage` or optional runtime environment variables. | `src/components/ApiKeyModal.tsx` |
| **Data Exfiltration** | All event calculations, budgets, and guest seating charts are generated and stored strictly on-device in browser `localStorage`. No telemetry or data is sold or transmitted to third parties. | `src/App.tsx` |
| **Denial of Service / Rate Limits** | Autonomous Heuristic AI Engine functions as an offline fallback whenever the network is unavailable or API quotas are reached. | `src/services/plannerGenerator.ts` (`queryEventCopilot`) |

## 2. Reporting Security Vulnerabilities
If you discover any security issue, please open an issue or reach out via GitHub to [@vivekyarra](https://github.com/vivekyarra).
