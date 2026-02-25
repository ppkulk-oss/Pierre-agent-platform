# Agent Platform Architecture — Executive Summary

> **Prepared for:** Colleague Review  
> **Date:** February 25, 2026  
> **Version:** 1.0

---

## 1. Overview

A personal multi-agent orchestration platform that manages AI agents for travel planning, wine hunting, calendar scheduling, and finance tracking. The system uses a modular architecture with vector-based memory, real-time messaging, and bidirectional Obsidian vault integration.

**Goal:** Build something impressive enough to "boast to any asshole nerd" while remaining practical for daily use.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Telegram   │  │   Discord    │  │      Streamlit UI        │  │
│  │  (Primary)   │  │  (Channels)  │  │   (Rich Dashboards)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                      ORCHESTRATION LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    OpenClaw Gateway                         │   │
│  │         (Agent spawning, routing, session mgmt)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│         ┌────────────────────┼────────────────────┐                 │
│         ▼                    ▼                    ▼                 │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────┐          │
│  │Agent: Odyssey│   │ Agent: Allemand│   │  Future...   │          │
│  │ (Travel)     │   │ (Wine Hunting) │   │ (Finance,    │          │
│  │              │   │                │   │  Calendar)   │          │
│  └──────────────┘   └────────────────┘   └──────────────┘          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                        SERVICE LAYER                                │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │
│  │  ChromaDB   │  │    Redis    │  │  Supabase   │  │  MCP      │  │
│  │  (Vectors   │  │  (Pub/Sub,  │  │  (Postgres  │  │  Adapters │  │
│  │   & Memory) │  │   Caching)  │  │   & Auth)   │  │  (GCal,   │  │
│  │             │  │             │  │             │  │  Email)   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └───────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                     KNOWLEDGE LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Obsidian Vault                           │   │
│  │         (Bidirectional sync via REST API)                   │   │
│  │    - Agent memory persistence                               │   │
│  │    - Human-readable knowledge base                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component List

| Component | Purpose | Technology |
|-----------|---------|------------|
| **OpenClaw Gateway** | Agent orchestration & routing | Custom (Node.js) |
| **ChromaDB** | Vector storage for agent memory & semantic search | ChromaDB |
| **Redis** | Pub/sub messaging, job queues, session caching | Redis 7+ |
| **Supabase** | Structured data, auth, user management | Postgres 15 |
| **MCP Adapters** | External API connectors (Calendar, Email, Finance) | TypeScript |
| **Obsidian Bridge** | Bidirectional sync with Obsidian vault | REST API |
| **Streamlit** | Rich dashboards for complex data visualization | Python |

---

## 4. Cost Estimate (Monthly)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Railway (Orchestration) | Hobby | $5 |
| Supabase (Database) | Free → Pro | $0–$25 |
| Redis Cloud | 250MB | $0–$5 |
| ChromaDB | Self-hosted | $0 |
| OpenAI API | Usage-based | $10–$50 |
| **Total** | | **$15–$85** |

*Note: Costs scale with usage. Initial MVP targets $15-25/month.*

---

## 5. Build Timeline

### Phase 1: Foundation (Weeks 1–2)
- [ ] Docker Compose local setup
- [ ] ChromaDB + Redis integration
- [ ] Basic agent spawning framework

### Phase 2: Core Services (Weeks 3–6)
- [ ] Obsidian vault sync
- [ ] MCP adapters (Calendar, Email)
- [ ] Memory persistence layer

### Phase 3: Agents (Weeks 7–12)
- [ ] Migration of existing agents (Odyssey, Allemand)
- [ ] Finance agent development
- [ ] Calendar scheduling agent

### Phase 4: Polish (Weeks 13–16)
- [ ] Streamlit dashboards
- [ ] Discord channel integration
- [ ] Production deployment

**Total Timeline:** 4 months (MVP in 6 weeks)

---

## 6. Key Decisions

| Decision | Rationale |
|----------|-----------|
| **ChromaDB over Pinecone** | Open-source, self-hostable, no vendor lock-in, good enough for personal scale |
| **Redis over RabbitMQ** | Simpler ops, built-in caching, pub/sub for real-time agent updates |
| **Supabase over Railway Postgres** | Better auth, generous free tier, easier migration path |
| **Hybrid hosting** | Railway's hobby plan is too limited for full stack; split orchestration (Railway) from data (Supabase) |
| **Obsidian integration** | Prashant already uses Obsidian; bidirectional sync keeps human + agent knowledge in sync |
| **Docker Compose** | Simplest path to reproducible deployment; can migrate to K8s later if needed |

---

## 7. Risks / Concerns

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Hosting limits** | Railway hobby plan may throttle under load | Monitor early; ready to upgrade to Pro ($25/mo) |
| **Vector search at scale** | ChromaDB may struggle beyond ~100k vectors | Implement partitioning; evaluate migration to Pinecone if needed |
| **MCP adapter reliability** | External APIs (Google Calendar, etc.) change frequently | Abstract behind interface; graceful degradation |
| **Obsidian sync complexity** | File-based sync has edge cases (conflicts, deletions) | Versioning strategy; manual conflict resolution UI |
| **Scope creep** | 4-month timeline is aggressive | Hard MVP cut at 6 weeks; ship or cut features |

---

## 8. Success Criteria

1. **Agents survive restarts** — memory persists across sessions
2. **Sub-5s spawn time** — new agent instances spin up quickly
3. **Obsidian sync works** — bidirectional updates within 30 seconds
4. **Costs under $50/mo** — at production load

---

*Questions? Contact Prashant for technical deep-dive.*
