<div align="center">

# ⚡ AI Rigs

### Tell it your AI workload. Get a build that actually runs it — priced in ₹.

A full-stack **AI workstation configurator for the Indian market.** Answer a 9-step wizard about the models you want to run, and an AI engine assembles a real, in-stock hardware build — GPUs, CPU, RAM, motherboard, PSU, rack — with live prices in **INR** and the reasoning behind every part.

<br/>

![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-JSONB-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white)

</div>

---

## 🎯 The problem

Buying hardware to run local LLMs is a minefield. *"Will an RTX 4090 run Llama 70B? At what quantization? What CPU pairs with it? Is it in stock in India, and what does it actually cost in rupees?"*

**AI Rigs answers all of that in one flow.** No spreadsheets, no forum-diving, no guessing at VRAM math.

---

## ✨ What it does

| | |
|---|---|
| 🧙 **Conversational wizard** | A config-driven 9-step flow — task → model → precision → budget → intensity → priorities → brand → expansion → review. Steps adapt to your answers (the precision step vanishes for image/video models). |
| 🧮 **Real VRAM math** | Computes a VRAM floor from your model + quantization (fp16 ×1, q8 ×0.5, q4 ×0.25) so the build is sized for what you'll *actually* load. |
| 🤖 **AI-generated builds** | Gemini picks parts from a curated catalog — but **never sets the prices.** Every component is mapped back to a real, seeded product with a verified INR price. |
| 📊 **GPU leaderboard** | Live benchmark data scraped from **localscore.ai** and **arena.ai** — tokens/sec, TTFT, and price-performance across accelerators. |
| 🛒 **Grounded in reality** | 82 real products across 6 categories (GPU, CPU, RAM, motherboard, PSU, rack), each with stock status and specs. |
| 🔍 **Compare & inspect** | Product-comparison and full-specification views for drilling into any build. |

---

## 🏗️ Architecture

```
                          ┌──────────────────────────────┐
                          │      Next.js 16 Frontend      │
                          │  React 19 · Tailwind v4 · TS  │
                          │   9-step config-driven wizard │
                          └───────────────┬──────────────┘
                                          │  POST /api/builds
                                          ▼
        ┌──────────────────────────────────────────────────────────┐
        │              Spring Boot 4 · Java 21 Backend              │
        │                    (Spring Modulith)                      │
        │                                                           │
        │   build ──▶ resolve budget + VRAM floor                   │
        │     │       filter catalog by budget & VRAM               │
        │     │       build Gemini prompt ──▶ 🤖 Gemini 2.5 Flash   │
        │     │       parse response, re-map to REAL products       │
        │     ▼                                                     │
        │   product · aimodel · benchmark  (isolated modules)       │
        └───────────────────────────┬──────────────────────────────┘
                                     ▼
              ┌───────────────────────────────────────────┐
              │   PostgreSQL (JSONB) · Flyway · Redis      │
              │   products · ai_models · builds · benchmarks│
              └───────────────────────────────────────────┘
```

**Design principles**
- 🧩 **Modular monolith** — `benchmark`, `product`, `aimodel`, and `build` modules never cross-import each other's repos or entities; they talk service-to-service only.
- 🔒 **AI never touches money** — Gemini proposes parts by `catalog_id`; the backend resolves prices from the database. Hallucinated prices can't leak into a build.
- 🧷 **Builds are immutable snapshots** — `build_items.product_id` is a soft reference, so catalog updates never rewrite someone's old build.

---

## 🧰 Tech stack

**Backend** — Java 21 · Spring Boot 4 · Spring Modulith · Spring Security · PostgreSQL + JSONB · Flyway · Redis · Google Gemini (`gemini-2.5-flash`)

**Frontend** — Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 (CSS-first) · Tremor · Remix Icons · pnpm

---

## 🚀 Quick start

### Prerequisites
- Java 21 · Maven · PostgreSQL · Node + pnpm · a Gemini API key

### 1 · Backend

```bash
cd backend
export GEMINI_API_KEY=AIza...          # your Gemini key
./mvnw spring-boot:run                 # starts on :8080 (docker-compose spins up Postgres)
```

Generate your first build:

```bash
curl -X POST http://localhost:8080/api/builds \
  -H "Content-Type: application/json" \
  -d '{
    "task": "llm_inference",
    "modelName": "Llama 3.1 70B",
    "modelVramGb": 40,
    "precision": "q4",
    "budgetTier": "serious",
    "intensity": "daily",
    "brand": "nvidia",
    "expand": "ram",
    "sessionId": "test-001"
  }'
```

### 2 · Frontend

```bash
cd frontend
pnpm install
pnpm dev                               # http://localhost:3000
```

---

## 🗺️ Roadmap

- [ ] **Performance estimates on builds** — attach real benchmark data so you see *"your RTX 4090 will run Llama 70B Q4 at ~45 tok/s"*, not just a parts list.
- [ ] **Build scoring** — rank builds on VRAM headroom, tokens/sec-per-rupee, and task fit (0–100 with a per-axis breakdown).
- [ ] **Persisted upgrade paths** and product buy-links.

See [`backend/ROADMAP.md`](backend/ROADMAP.md) for the full plan.

---

<div align="center">

**Built for the people who'd rather run the model than fight the hardware.** 🛠️

</div>
