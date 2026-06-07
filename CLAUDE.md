# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`barangsecond.com` — secondhand-goods inventory + sales + sharia-credit tracker with an insights dashboard. Products (phones, cars, anything; differentiated by tags) are bought and resold either **cash** or via **sharia credit** (down payment + fixed monthly installments over a tenor). See `_docs/concept.md`.

## Stack

- **Backend**: Django 5.2 + Django REST Framework, Python ≥3.10, deps via `uv`.
- **Frontend**: React 19 + Vite + TypeScript, TanStack Router (file-based) + TanStack Query, Jotai, Tailwind v4, radix-ui/shadcn, Recharts. Package manager **pnpm** (in `frontend/`).
- **DB**: SQLite for host dev (default), Postgres when `POSTGRES_HOST` is set (used in Docker).

## Commands

Backend (run from repo root; `Makefile` wraps these):
- `make dev` — runserver on :8000 (`uv run manage.py runserver 8000`)
- `make mmg` / `make migrate` — makemigrations / migrate
- `make lint` — `ruff format .` then `ruff check . --fix` (line length 100, rules E/F/I/B/UP)
- `uv run manage.py test` — run tests; single app/test e.g. `uv run manage.py test sales` or `uv run manage.py test sales.tests.ClassName.test_method`
- `make dock` — full docker compose build + up + logs (uses `.env.docker`)

Frontend (from `frontend/`):
- `pnpm run dev` (or `make web` from root) — Vite dev server on :5173, proxies `/api` → :8000
- `pnpm run build` — `tsc -b && vite build`
- `pnpm run lint` — eslint

There are two separate Tailwind setups: `frontend/` uses the Vite Tailwind plugin for the SPA; the **root** `static/input.css` → `static/output.css` (`make tw-run`/`tw-build`) is only for the Django server-rendered templates.

## Architecture

### Backend: domain apps over a shared core

Models are split into three bounded-context apps plus `core`:
- `core` — `BaseModel` (abstract), `AppSetting`, `Profile`; helpers `make_object_id`, `add_months`, `MONEY` dict.
- `inventory` — `Tag`, `Product` (status: available/reserved/sold; `profit` property).
- `sales` — `Sale` (OneToOne→Product, cash/credit type; `profit` property).
- `credit` — `Credit` (OneToOne→Sale), `Installment`, plus module-level `mark_overdue(today)`.

**`core.BaseModel` conventions every model inherits** (`core/models.py`):
- Primary key is a **string MongoDB-style ObjectId** (`make_object_id`), not an int. URL params are therefore `<str:...>`.
- `actor` FK to `User` records who made the change — set it on every create/update (`serializer.save(actor=request.user)` or `actor=request.user` in `.create()`).
- `created_on`/`updated_on` auto timestamps.
- Money fields use `**MONEY` (`DecimalField(max_digits=14, decimal_places=2)`). Decimals serialize as **strings** in JSON; frontend parses with `formatIDR`.

### Backend: API layer

REST lives under `/api/v1/` (`core.urls` → `api/v1/urls.py`). Pattern is **function-based DRF views** with `@api_view([...])` + `@permission_classes([IsAuthenticated])`, one module per domain (`products_api.py`, `sales_api.py`, `credits_api.py`, `dashboard_api.py`, `tags_api.py`, `auth_api.py`, `payments_api.py`). No ViewSets/routers — add a route by writing a function and wiring it explicitly in `api/v1/urls.py`. Serializers all live in `api/v1/serializers.py`.

Key business flows:
- **Creating a sale** (`sales_api.sales` POST) is transactional: creates the `Sale`, and if `sale_type == credit` builds the `Credit` + all `Installment` rows (`_build_installments`), then flips the product to `SOLD`. The **final installment absorbs rounding remainder** so installments sum exactly to the financed amount.
- **Overdue handling**: `credit.models.mark_overdue(today)` is called at the top of credit and dashboard read endpoints (idempotent bulk update) — there is **no cron**; overdue status updates lazily on read.
- **Dashboard** (`dashboard_api.stats`) is pure DB aggregation (Count/Sum/F/TruncMonth) returning inventory/sales/credit summaries plus revenue-by-month and sales-by-tag series.

### Auth (two distinct surfaces)

1. **SPA / API**: Google OAuth. Frontend posts the Google `credential` to `POST /api/v1/auth/google/`; `GoogleAuthSerializer` verifies it via `google.oauth2.id_token`, then `get_or_create`s a User and returns a **DRF auth Token**. Frontend stores it in `localStorage` and sends `Authorization: Token <key>` (see `frontend/src/lib/api.ts`). DRF default auth is `TokenAuthentication`, default permission `IsAuthenticated`.
2. **Server-rendered admin dashboard**: Django session login at `/login/` → `/dashboard/` (`core/views.py`), gated by `SuperuserRequiredMixin`. Separate from the React app; uses Django templates + the root Tailwind build.

Payments use **Mayar** (Indonesian provider) via `payments_api.webhook` and `core/payments/`; config via `MAYAR_*` env vars.

### Frontend structure

- `src/features/<domain>/` (auth, inventory, sales, credit, dashboard) each hold `api.ts` (typed fetch wrappers over `lib/api.ts`), `hooks.ts` (TanStack Query `useQuery`/`useMutation`, mutations invalidate a stable query-key array), `types.ts`, and `components/`.
- `src/routes/` are TanStack Router file-based routes (`autoCodeSplitting`); `routeTree.gen.ts` is generated — don't edit by hand. Note the `_.` convention: `products_.$id.tsx`, `products_.new.tsx` are non-nested sibling routes.
- `src/lib/api.ts` — central `api<T>()` fetch helper; throws `ApiError`, injects the token, supports `skipAuth`, treats 204 as empty.
- `src/lib/format.ts` — `formatIDR` / `formatDate` (Indonesian locale, IDR). Use these for all money/date display.
- `@/` alias → `frontend/src/`.

## Environment

Copy `.env.example` → `.env`. Leave `POSTGRES_HOST` **empty** to use SQLite for host dev; set it (e.g. `postgres`) for Postgres/Docker. `SECRET_KEY` must be set when `DEBUG=False` (startup raises otherwise). Frontend needs `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`. Timezone defaults to `Asia/Jakarta`.

## Conventions to follow

- New models inherit `core.models.BaseModel`; money fields use `**MONEY`; always set `actor`.
- New endpoints: function-based `@api_view`, serializer in `serializers.py`, route in `api/v1/urls.py`, `<str:...>` id params.
- Use `select_related`/`prefetch_related` on list/detail endpoints (existing code does, to avoid N+1 across product/credit/installments).
- Run `make lint` before committing backend changes.
