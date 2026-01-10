# Frontend Documentation

## Overview
This is a React + TypeScript frontend application built with Vite, using Tailwind CSS for styling and React Router for navigation.

---

## 🎨 Primary Color

The primary color scheme is based on **Blue**:

- **Primary 500**: `#3b82f6` (Main primary color)
- **Primary 600**: `#2563eb` (Hover/Active states)
- **Primary 700**: `#1d4ed8` (Darker variant)
- **Primary 400**: `#60a5fa` (Lighter variant)
- **Primary 300**: `#93c5fd` (Light variant)
- **Primary 200**: `#bfdbfe` (Very light variant)
- **Primary 100**: `#dbeafe` (Extremely light variant)
- **Primary 50**: `#eff6ff` (Background tint)

### Color Usage
The primary color is used throughout the application for:
- Buttons and interactive elements
- Links and navigation
- Accent highlights
- Status indicators
- Brand elements

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/           # API client modules
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components (routes)
│   ├── services/      # Business logic services
│   ├── store/         # State management (Zustand)
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main app component with routing
│   ├── main.tsx       # Application entry point
│   └── index.css      # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🧩 Components List

All reusable UI components located in `src/components/`:

1. **EmptyState.tsx**
   - Displays empty state messages when no data is available
   - Used across various pages for better UX

2. **ErrorBoundary.tsx**
   - React error boundary component
   - Catches and handles runtime errors gracefully
   - Prevents entire app from crashing

3. **Layout.tsx**
   - Main layout wrapper component
   - Includes navigation, sidebar, and content area
   - Provides consistent page structure

4. **LoadingSpinner.tsx**
   - Loading indicator component
   - Used during data fetching operations

5. **MarkdownEditor.tsx**
   - Markdown text editor component
   - Supports markdown syntax for rich text editing
   - Used in ticket descriptions and comments

6. **NotificationCenter.tsx**
   - Notification panel/dropdown component
   - Displays user notifications
   - Handles notification interactions

7. **ProtectedRoute.tsx**
   - Route protection component
   - Ensures only authenticated users can access protected routes
   - Redirects to login if not authenticated

8. **Toast.tsx**
   - Toast notification component
   - Displays temporary success/error/info messages
   - Includes ToastContainer for managing multiple toasts

---

## 📄 Pages List

All page components (routes) located in `src/pages/`:

1. **Login.tsx**
   - User authentication page
   - Route: `/login`
   - Handles user login functionality

2. **Dashboard.tsx**
   - Main dashboard/home page
   - Route: `/dashboard`
   - Displays overview statistics and recent activity

3. **TicketList.tsx**
   - List view of all tickets
   - Route: `/tickets`
   - Includes filtering, sorting, and pagination

4. **TicketDetail.tsx**
   - Detailed view of a single ticket
   - Route: `/tickets/:id`
   - Shows ticket information, comments, history, and attachments

5. **CreateTicket.tsx**
   - Form to create a new ticket
   - Route: `/tickets/new`
   - Handles ticket creation with validation

6. **Users.tsx**
   - User management page
   - Route: `/users`
   - Displays and manages system users

7. **Profile.tsx**
   - User profile page
   - Route: `/profile`
   - Shows and allows editing of user profile information

8. **Settings.tsx**
   - Application settings page
   - Route: `/settings`
   - User preferences and application configuration

9. **TagManagement.tsx**
   - Tag management page
   - Route: `/tags`
   - Create, edit, and manage ticket tags

---

## 🔌 API Modules

All API client modules located in `src/api/`:

1. **activity.ts** - Activity log API endpoints
2. **analytics.ts** - Analytics and reporting API endpoints
3. **attachments.ts** - File attachment API endpoints
4. **auth.ts** - Authentication API endpoints (login, logout, token refresh)
5. **client.ts** - Base API client configuration (Axios instance)
6. **comments.ts** - Comment API endpoints
7. **notifications.ts** - Notification API endpoints
8. **savedFilters.ts** - Saved filter API endpoints
9. **tags.ts** - Tag API endpoints
10. **ticketHistory.ts** - Ticket history API endpoints
11. **tickets.ts** - Ticket CRUD API endpoints
12. **userPreferences.ts** - User preference API endpoints
13. **users.ts** - User management API endpoints
14. **watchers.ts** - Ticket watcher API endpoints

---

## 🪝 Custom Hooks

All custom React hooks located in `src/hooks/`:

1. **useAuth.ts**
   - Authentication hook
   - Provides auth state and methods
   - Handles login, logout, and token management

2. **useLazyLoad.ts**
   - Lazy loading hook
   - Implements lazy loading for performance optimization
   - Used for loading data on scroll or demand

---

## 🗄️ State Management (Store)

All state management modules located in `src/store/`:

1. **auth.ts**
   - Authentication state store
   - Manages user authentication state
   - Handles token storage and user data

2. **theme.ts**
   - Theme state store
   - Manages light/dark theme preferences
   - Handles theme switching

3. **toast.ts**
   - Toast notification state store
   - Manages toast messages queue
   - Handles toast display and removal

---

## 🔧 Services

Business logic services located in `src/services/`:

1. **workflow.ts**
   - Workflow management service
   - Handles ticket workflow logic
   - Manages status transitions and business rules

---

## 📝 Type Definitions

All TypeScript types and interfaces located in `src/types/index.ts`:

### Enums:
- **SystemRole**: ADMIN, MANAGER, MEMBER, VIEWER
- **Designation**: DEVELOPER, TESTER, QA, TEAM_LEAD, PROJECT_MANAGER
- **IssueType**: BUG, TASK, IMPROVEMENT
- **Priority**: LOW, MEDIUM, HIGH, CRITICAL
- **TicketStatus**: OPEN, IN_PROGRESS, REVIEW, IN_TESTING, BLOCKED, DONE
- **NotificationType**: TICKET_CREATED, TICKET_ASSIGNED, TICKET_STATUS_CHANGED, TICKET_COMMENTED, TICKET_UPDATED, TICKET_WATCHED

### Interfaces:
- **User** - User data structure
- **Ticket** - Ticket data structure
- **Comment** - Comment data structure with threading support
- **ActivityLog** - Activity log entry
- **Notification** - Notification data structure
- **Attachment** - File attachment data structure
- **Tag** - Tag data structure
- **UserPreference** - User preference settings
- **TicketHistory** - Ticket change history
- **TicketWatcher** - Ticket watcher relationship
- **LoginRequest** - Login request payload
- **TokenResponse** - Authentication token response
- **TicketCreate** - Ticket creation payload
- **TicketUpdate** - Ticket update payload
- **TicketStatusUpdate** - Status update payload
- **CommentCreate** - Comment creation payload

---

## 📦 Dependencies

### Production Dependencies:
- **react** (^18.2.0) - React library
- **react-dom** (^18.2.0) - React DOM renderer
- **react-router-dom** (^6.20.0) - Client-side routing
- **axios** (^1.6.2) - HTTP client for API requests
- **date-fns** (^2.30.0) - Date utility library
- **react-markdown** (^9.0.1) - Markdown renderer for React
- **remark-gfm** (^4.0.0) - GitHub Flavored Markdown support

### Development Dependencies:
- **@types/react** (^18.2.43) - React TypeScript definitions
- **@types/react-dom** (^18.2.17) - React DOM TypeScript definitions
- **@typescript-eslint/eslint-plugin** (^6.14.0) - TypeScript ESLint plugin
- **@typescript-eslint/parser** (^6.14.0) - TypeScript ESLint parser
- **@vitejs/plugin-react** (^4.2.1) - Vite React plugin
- **autoprefixer** (^10.4.16) - CSS autoprefixer
- **eslint** (^8.55.0) - JavaScript linter
- **eslint-plugin-react-hooks** (^4.6.0) - React hooks ESLint rules
- **eslint-plugin-react-refresh** (^0.4.5) - React refresh ESLint plugin
- **postcss** (^8.4.32) - CSS post-processor
- **tailwindcss** (^3.3.6) - Utility-first CSS framework
- **typescript** (^5.2.2) - TypeScript compiler
- **vite** (^5.0.8) - Build tool and dev server

---

## ⚙️ Configuration

### Vite Configuration (`vite.config.ts`)
- **Port**: 5173 (development server)
- **Proxy**: `/api` requests proxied to `http://localhost:8000`
- **Build**: Optimized with content hashing for caching
- **Source Maps**: Disabled in production

### TypeScript Configuration (`tsconfig.json`)
- **Target**: ES2020
- **Module**: ESNext
- **JSX**: react-jsx
- **Strict Mode**: Enabled
- **Module Resolution**: bundler

### Tailwind Configuration (`tailwind.config.js`)
- **Dark Mode**: Class-based strategy
- **Primary Color**: Blue palette (50-900 shades)
- **Animations**: fadeIn, slideUp, slideDown
- **Transitions**: Height and spacing transitions enabled

---

## 🎯 Routing Structure

All routes are defined in `src/App.tsx`:

| Route | Component | Protected | Description |
|-------|-----------|-----------|-------------|
| `/login` | Login | No | Login page |
| `/` | Dashboard (redirect) | Yes | Root redirects to dashboard |
| `/dashboard` | Dashboard | Yes | Main dashboard |
| `/tickets` | TicketList | Yes | Ticket list view |
| `/tickets/new` | CreateTicket | Yes | Create new ticket |
| `/tickets/:id` | TicketDetail | Yes | Ticket detail view |
| `/users` | Users | Yes | User management |
| `/profile` | Profile | Yes | User profile |
| `/settings` | Settings | Yes | Application settings |
| `/tags` | TagManagement | Yes | Tag management |

---

## 🎨 Styling & Theme

- **Framework**: Tailwind CSS
- **Dark Mode**: Supported (class-based)
- **Font Family**: System fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.)
- **Code Font**: Source Code Pro, Menlo, Monaco, Consolas, Courier New
- **Animations**: Custom fadeIn, slideUp, slideDown animations

---

## 🚀 Scripts

Available npm scripts (from `package.json`):

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

---

## 📋 Features

### Core Features:
- ✅ User authentication and authorization
- ✅ Ticket management (CRUD operations)
- ✅ Comment system with threading
- ✅ File attachments
- ✅ Activity logging
- ✅ Notifications system
- ✅ Tag management
- ✅ User preferences
- ✅ Saved filters
- ✅ Ticket history tracking
- ✅ Ticket watchers
- ✅ Dark mode support
- ✅ Responsive design

### UI/UX Features:
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error boundaries
- ✅ Empty states
- ✅ Markdown editor
- ✅ Lazy loading
- ✅ Protected routes

---

## 🔐 Security

- Protected routes require authentication
- API requests include authentication tokens
- CSRF protection (handled by backend)
- Input sanitization (handled by backend)

---

## 📱 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features required
- Responsive design for mobile and desktop

---

## 📄 License

Private project - All rights reserved

---

*Last Updated: Generated automatically from codebase structure*










