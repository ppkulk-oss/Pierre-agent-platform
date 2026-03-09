# Pierre Morning Protocol — SKILL.md

## Format Specification

**Header:**
```
🌀 The Prashant Kulkarni Daily Brief
[Day], [Month] [Date], [Year]
```

**Module Structure (6 modules, numbered 0-5):**

```
0. 🌍 The 1440 Brief
[World news digest — 5-7 concise, just-the-facts headlines. Geopolitics, markets, major incidents. Objective, no fluff, 1440-style.]

1. 🏥 The Clinical Edge
[Anesthesiology & MedTech content — narrative bullets, key findings]

2. ⚛️ The Quantum Observer
[Physics & Astronomy — conference calendar, recent papers]

3. 🎾 Court Vision
[Tennis — tournament status, upcoming events, results if available]

4. 🤖 Silicon & Intelligence
[Tech & AI — ecosystem updates, stack changes, tooling]

5. 🍷 The Cellar & The League
[Wine intelligence + NFL/Fantasy football — deals, allocations, dynasty moves]
```

**Rules:**
- Start numbering at 0 (The 1440 Brief), then 1-5
- Use narrative bullet style, not heavy markdown headers
- Include source citations at bottom of each section
- Keep tone concise — this is a briefing, not an encyclopedia
- 1440 Brief: 5-7 headlines max, just-the-facts, objective

**Date Filter:** Only 2026 content (avoid stale news)

**Modules to Query:**
0. The 1440 Brief → World news, geopolitics, markets, major incidents
1. Clinical Edge → Anesthesiology, MedTech, perioperative AI
2. Quantum Observer → Physics, astronomy, dark matter, neutrinos
3. Court Vision → Tennis tournaments, ATP/WTA schedules
4. Silicon & Intelligence → AI agents, LLMs, workflow tools
5. Cellar & League → Wine deals, allocations, NFL fantasy

**Cron Schedule:** Daily at 07:00 AM ET
