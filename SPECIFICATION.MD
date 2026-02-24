1. Project Overview
CavaScan Admin is the desktop management interface for the CavaStock ecosystem. It is a standalone React Single Page Application (SPA) designed for heavy administrative tasks, bulk data management, and business analytics.

2. Technical Stack
Framework: React 19 (Vite as build tool).

Language: TypeScript (Strict mode).

Styling: Tailwind CSS + Headless UI or Shadcn/UI.

State Management & API: TanStack Query v5 (React Query) for server state.

Routing: React Router v7.

Icons: Lucide React.

HTTP Client: Axios with Interceptors for JWT handling.

3. Core Features
3.1 Authentication
Login page (Email/Password) interacting with the API's JWT endpoint.

Secure token storage in HttpOnly cookies or memory (with refresh logic).

Automatic redirect to Login if 401 Unauthorized is returned.

3.2 Shop Management
Shop Switcher: Global selector to define the active "Domain" (Shop ID) for all requests.

Member Management: Interface to invite users to a shop and assign Casbin roles (Owner, Helper, Guest).

3.3 Inventory & Bulk Operations
Data Table: Advanced filtering and sorting for Items and Containers.

Bulk Actions: Update status (e.g., mark 50 items as "Sold") or move items between containers in one click.

Image Management: Upload and preview item photos (integrated with Symfony/Flysystem).

3.4 Label Printing Center
QR Generator: Generate PDF layouts for printing UUID v7 QRCodes.

Templates: Support for standard sticker sheet formats (e.g., Avery labels).

3.5 Movement Audit Trail
Visual timeline of MovementLog for specific items or containers to track "who moved what and when".

4. API Integration (Contract)
Base URL: Defined via .env (pointing to cavascan-api).

Data Format: JSON-LD / Hydra (API Platform standard).

Context Header: Every request must include X-Shop-Id based on the selected shop in the UI.

5. Directory Structure
Plaintext
src/
  ├── api/          # Axios instances & TanStack Hooks
  ├── components/   # Reusable UI (Buttons, Inputs, Modals)
  ├── contexts/     # Auth & Shop selection contexts
  ├── layouts/      # Dashboard vs Auth layouts
  ├── pages/        # View components
  ├── types/        # TypeScript interfaces (mapped from API)
  └── utils/        # Formatters, PDF generation logic
6. Local Infrastructure (Makefile)
The repo must include a Makefile for standard operations:

make init: Install dependencies and setup .env.

make dev: Launch Vite development server.

make build: Production build.

make lint: Run ESLint and Prettier.
