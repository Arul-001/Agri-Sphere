# Task Checklist - BFF Architecture Implementation

## Phase 1: Core Dashboards & Registration
- [x] Rename `buyer` role to `customer` globally and update navigation links in `src/routes/+layout.svelte`
- [x] Create API Endpoint: `src/routes/api/dashboard/+server.js` (GET)
  - Must authorize using `locals.user`
  - Retrieve farmer stats if farmer (active crops, expenses, inventory)
  - Retrieve customer stats if customer (marketplace listing count, purchases, etc.)
  - Retrieve admin stats if admin (total users, role breakdown)
- [x] Implement/Update SvelteKit server load files for dashboards:
  - [x] `src/routes/admin/dashboard/+page.server.js`
  - [x] `src/routes/farmer/dashboard/+page.server.js`
  - [x] `src/routes/customer/dashboard/+page.server.js`
- [x] Clean up Dashboard presentation pages (`+page.svelte`) to consume loader data and remove client-side SDK subscriptions
  - [x] `src/routes/admin/dashboard/+page.svelte`
  - [x] `src/routes/farmer/dashboard/+page.svelte`
  - [x] `src/routes/customer/dashboard/+page.svelte`
- [x] Create API Endpoint: `src/routes/api/farmer/profile/+server.js` (GET, PATCH)
- [x] Refactor client-side signup flow in `src/routes/signup/+page.svelte` to match role updates and use backend APIs

## Phase 2: Farm Operations (Farmer Module)
- [x] Crop Management (`src/routes/farmer/crops` & `/api/crops`)
- [x] Expense Management (`src/routes/farmer/expenses` & `/api/expenses`)
- [x] Irrigation Management (`src/routes/farmer/irrigation` & `/api/irrigation`)
- [x] Harvest Management (`src/routes/farmer/harvests` & `/api/harvests`)

## Phase 3: Marketplace & Inventory
- [x] Product Listing & Marketplace (`/marketplace`, `src/routes/farmer/products`, `/api/products`)
- [x] Inventory Management (`src/routes/farmer/inventory` & `/api/inventory`)

## Phase 4: Advanced Features
- [x] AI Disease Detection (`/api/disease-detection`)
- [x] Notifications (`/api/notifications`)
- [x] Verification & Trust (`/api/admin/verify`)
- [x] Analytics (`/api/analytics`)
