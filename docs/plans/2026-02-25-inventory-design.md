# Inventory Feature Design

## Context

The CavaScan admin app has login and shop switching working. The next feature is the inventory: browsing Containers and Items for the selected shop.

## API Data

**Container**: `id`, `label` (e.g. BOX-A1), `locationDescription`, `shop` (IRI), `items` (IRI[])

**Item**: `id`, `title`, `description`, `priceCents` (integer), `status` (active | sold_online | sold_offline | removed), `shop` (IRI), `container` (IRI), `platformLinks` (IRI[]), `movementLogs` (IRI[])

API returns JSON-LD with `member` array. Requests require `X-Shop-Id` header.

## Navigation

- Two new entries in DashboardLayout nav: **Containers** and **Items**
- Routes: `/containers`, `/containers/:id`, `/items`
- Hierarchical: Containers list → click → Container detail (shows its items)

## Page: Containers (`/containers`)

- Table with columns: Label, Location, Item count
- Text search field filtering on label and location
- Sortable column headers (label, location, item count)
- Row click navigates to `/containers/:id`

## Page: Container Detail (`/containers/:id`)

- Header with container label, location, and back button
- Table of items in this container (same columns as Items page)

## Page: Items (`/items`)

- Table with columns: Title, Description, Price, Status, Container
- Status badges:
  - `active` → green
  - `sold_online` → blue
  - `sold_offline` → orange
  - `removed` → gray
- Status filter: clickable pills at top (All / Active / Sold online / Sold offline / Removed)
- Text search field filtering on title and description
- Sortable column headers
- Price formatted as EUR with `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`
- Container column links to `/containers/:id`

## Infrastructure

- Add `X-Shop-Id` header to Axios client from selected shop
- New hooks: `useContainers()`, `useContainer(id)`, `useItems()`
- New types: `Container`, `Item`
- Reusable `DataTable` component (table with sort + search)
- Utility `formatPrice(cents)` → "85,00 €"

## Decisions

- No TanStack Table for now — simple HTML table with Tailwind, sort and search in JS
- EUR only, no multi-currency
- No pagination (small dataset for now)
- No bulk selection yet (future feature)
