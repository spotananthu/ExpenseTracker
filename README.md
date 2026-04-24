# Expense Tracker

A full-stack personal expense tracking application built with production-quality standards.

## Live Demo

- **Frontend:** https://expense-tracker-kappa-five-46.vercel.app
- **Backend API:** https://expense-tracker-api-53bf.onrender.com

## Features

- Create expense entries with amount, category, description, and date
- View list of expenses (sorted by date, newest first)
- Filter expenses by category
- Sort expenses (newest/oldest first)
- Category summary panel with donut chart visualization
- Display total of all expenses
- Idempotent POST requests (handles duplicate submissions/retries)
- Input validation (client and server side)
- Loading and error states
- Responsive design
- Automated tests (backend + frontend)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL (Supabase) |
| Hosting | Vercel (frontend) + Render (backend) |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js        # Express server and API routes
│   │   ├── index.test.js   # Backend API tests (Jest)
│   │   └── db.js           # Supabase client configuration
│   ├── package.json
│   └── Procfile            # Render deployment config
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── api.js          # API client functions
│   │   ├── index.css       # Styles
│   │   ├── main.jsx        # React entry point
│   │   └── test/
│   │       ├── setup.js    # Test setup
│   │       └── api.test.js # Frontend utility tests (Vitest)
│   ├── index.html
│   └── package.json
└── README.md
```

## API Endpoints

### POST /expenses
Create a new expense.

**Request Headers:**
- Content-Type: application/json
- X-Idempotency-Key: unique-key (optional, prevents duplicate submissions)

**Request Body:**
```json
{
  "amount": 150.50,
  "category": "Food",
  "description": "Lunch at restaurant",
  "date": "2026-04-24"
}
```

### GET /expenses
Retrieve expenses with optional filtering.

**Query Parameters:**
- category (optional): Filter by category
- sort=date_desc (optional): Sort by date, newest first

### GET /categories
Get list of unique categories from existing expenses.

### GET /health
Health check endpoint.

## Key Design Decisions

### 1. Money Handling
- **Stored as integers (paise):** Amounts are converted to paise (1 rupee = 100 paise) before storage to avoid floating-point precision errors
- **Converted on display:** Amounts are divided by 100 when returned to client

### 2. Idempotency for Duplicate Submissions
- Client generates a unique X-Idempotency-Key before each form submission
- Server stores the key with the created expense ID
- On retry with same key, server returns the existing expense instead of creating duplicate
- Handles: double-clicks, page refreshes after submit, network retries

### 3. Database Choice (PostgreSQL via Supabase)
- **Why PostgreSQL:** ACID compliance, proper data types for money (BIGINT), production-grade
- **Why Supabase:** Free tier, managed PostgreSQL, easy setup, reliable

### 4. Architecture
- Separate backend API demonstrates full-stack capability
- Frontend calls backend (not database directly) - proper separation of concerns
- Backend handles all validation and business logic

### 5. Frontend Sorting Strategy
- **Current approach:** Sorting is handled on the frontend for instant UX response
- **Why this works:** Small dataset without pagination
- **Production scale:** For large datasets, sorting would move to backend with database indexes and pagination (e.g., `GET /expenses?sort=date&order=desc&page=1&limit=20`)

## Trade-offs Due to Time Constraints

| Chose To Do | Instead Of |
|-------------|------------|
| Frontend sorting | Backend sorting with pagination |
| Predefined category dropdown | Free-text categories with autocomplete |
| Basic table display | Pagination for large datasets |
| Simple category filter | Date range picker |
| Basic responsive CSS | Full mobile-first component library |

## What I Intentionally Did Not Implement

1. **Authentication/User accounts** - Not required for this exercise
2. **Edit/Delete expenses** - Focused on core CRUD (Create/Read) as specified
3. **Advanced analytics** - Basic summary chart included, skipped complex dashboards

## Running Locally

### Prerequisites
- Node.js 18+
- npm

### Backend
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

## Running Tests

### Backend (Jest + Supertest)
```bash
cd backend
npm test
# 12 tests: validation, idempotency, CRUD operations
```

### Frontend (Vitest)
```bash
cd frontend
npm test
# 7 tests: API utilities, fetch calls
```

Tests run automatically during build on deploy.

## Deployment

- **Backend:** Render (auto-deploys from main branch, root directory: backend)
- **Frontend:** Vercel (auto-deploys from main branch, root directory: frontend)

---

Built by Anantha Krishnan G
