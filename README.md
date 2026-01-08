# IVAID Atlas - Frontend

React-based frontend application for the IVAID Atlas issue tracking system.

## 🏗️ Architecture

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Markdown**: React Markdown with GFM support

## 📋 Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env` file in the `frontend` directory:

```env
# Backend API URL
VITE_API_URL=http://localhost:8000
```

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### 5. Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── api/            # API client functions
│   │   ├── client.ts          # Base Axios client
│   │   ├── auth.ts            # Authentication API
│   │   ├── tickets.ts         # Tickets API
│   │   ├── users.ts           # Users API
│   │   ├── comments.ts        # Comments API
│   │   ├── watchers.ts        # Watchers API
│   │   ├── notifications.ts   # Notifications API
│   │   ├── attachments.ts     # Attachments API
│   │   ├── analytics.ts       # Analytics API
│   │   ├── tags.ts            # Tags API
│   │   ├── ticketHistory.ts   # Ticket history API
│   │   ├── userPreferences.ts # User preferences API
│   │   └── ... (other API clients)
│   ├── components/      # Reusable React components
│   │   ├── Layout.tsx          # Main layout with navigation
│   │   ├── ProtectedRoute.tsx # Route protection
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   ├── Toast.tsx          # Toast notifications
│   │   ├── LoadingSpinner.tsx # Loading indicators
│   │   ├── EmptyState.tsx     # Empty state display
│   │   ├── NotificationCenter.tsx # Notification center
│   │   ├── MarkdownEditor.tsx # Markdown editor
│   │   └── ... (other components)
│   ├── pages/          # Page components
│   │   ├── Login.tsx          # Login page
│   │   ├── Dashboard.tsx     # Dashboard page
│   │   ├── TicketList.tsx    # Ticket list page
│   │   ├── TicketDetail.tsx  # Ticket detail page
│   │   ├── CreateTicket.tsx  # Create ticket page
│   │   ├── Users.tsx         # User management page
│   │   ├── Profile.tsx       # User profile page
│   │   ├── Settings.tsx     # User settings page
│   │   ├── TagManagement.tsx # Tag management page
│   │   └── ... (other pages)
│   ├── hooks/          # Custom React hooks
│   │   ├── useAuth.ts        # Authentication hook
│   │   ├── useLazyLoad.ts    # Lazy loading hook
│   │   └── usePageTitle.ts   # Page title hook
│   ├── store/          # Zustand state management
│   │   ├── auth.ts           # Authentication store
│   │   ├── theme.ts          # Theme store (dark mode)
│   │   └── toast.ts          # Toast store
│   ├── services/       # Business logic services
│   │   └── workflow.ts       # Workflow validation
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts          # All type definitions
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind CSS configuration
└── postcss.config.js   # PostCSS configuration
```

## 🎨 Features

### Pages

- **Login** (`/login`) - User authentication
- **Dashboard** (`/dashboard`) - Overview with analytics and metrics
- **Ticket List** (`/tickets`) - List all tickets with filtering, search, and pagination
- **Ticket Detail** (`/tickets/:id`) - View and manage individual tickets
- **Create Ticket** (`/tickets/new`) - Create new tickets
- **Users** (`/users`) - User management (Admin/Manager only)
- **Profile** (`/profile`) - User profile and password management
- **Settings** (`/settings`) - User preferences (theme, notifications, language)
- **Tag Management** (`/tags`) - Tag management (Admin/Manager only)

### Components

- **Layout** - Main application layout with navigation, theme toggle, and notifications
- **ProtectedRoute** - Route protection with authentication and role-based access
- **ErrorBoundary** - Error handling wrapper to prevent app crashes
- **Toast** - Toast notification system for user feedback
- **LoadingSpinner** - Loading indicators and skeleton loaders
- **EmptyState** - Empty state displays for lists
- **NotificationCenter** - In-app notification center
- **MarkdownEditor** - Markdown editor with preview mode

### State Management

- **Auth Store** - Authentication state, user info, token management
- **Theme Store** - Dark/light mode with system preference detection
- **Toast Store** - Toast notification queue management

### Custom Hooks

- **useAuth** - Authentication hook with convenience methods
- **useLazyLoad** - Lazy loading hook for infinite scroll
- **usePageTitle** - Dynamic page title management

## 🔐 Authentication & Authorization

### Authentication Flow

1. User logs in via `/login` page
2. Credentials are sent to `/api/v1/auth/login`
3. Access token and refresh token are stored in Zustand store
4. Tokens are included in all API requests via Axios interceptors
5. Refresh token is automatically used when access token expires

### Protected Routes

- All routes except `/login` require authentication
- Role-based routes:
  - `/users` - Admin, Manager only
  - `/tags` - Admin, Manager only

### Permission-Based Features

- Ticket editing (title/description) - Admin, Manager only
- Ticket status updates - Based on role, designation, and assignment
- User creation/editing - Admin, Manager only
- Tag management - Admin, Manager only

## 🎨 Theming

### Dark Mode

The application supports dark mode with:
- Light mode
- Dark mode
- System preference detection

Theme preference is stored in user preferences and persisted across sessions.

### Styling

- **Tailwind CSS** for utility-first styling
- **Custom animations** (fadeIn, slideUp, slideDown)
- **Responsive design** for mobile, tablet, and desktop
- **Accessibility** features (ARIA labels, keyboard navigation)

## 📡 API Integration

### Base API Client

All API calls go through the base client (`src/api/client.ts`) which:
- Configures Axios with base URL
- Adds authentication tokens to requests
- Handles token refresh automatically
- Manages CSRF tokens
- Handles errors consistently

### API Clients

- `auth.ts` - Authentication endpoints
- `tickets.ts` - Ticket operations
- `users.ts` - User management
- `comments.ts` - Comment operations
- `watchers.ts` - Ticket watchers
- `notifications.ts` - Notifications
- `attachments.ts` - File attachments
- `analytics.ts` - Analytics data
- `tags.ts` - Tag management
- `ticketHistory.ts` - Ticket history
- `userPreferences.ts` - User preferences

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Development Server

The development server runs on port 5173 by default. It includes:
- Hot Module Replacement (HMR)
- Fast refresh
- Proxy configuration for API requests

### Code Quality

```bash
# Lint code
npm run lint

# Type checking (via TypeScript)
npm run build  # Will show TypeScript errors
```

## 📦 Dependencies

Key dependencies (see `package.json` for complete list):

- `react@^18.2.0` - React library
- `react-dom@^18.2.0` - React DOM
- `react-router-dom@^6.20.0` - Routing
- `axios@^1.6.2` - HTTP client
- `zustand@^4.4.7` - State management
- `react-markdown@^9.0.1` - Markdown rendering
- `remark-gfm@^4.0.0` - GitHub Flavored Markdown
- `date-fns@^2.30.0` - Date utilities
- `tailwindcss@^3.3.6` - CSS framework
- `typescript@^5.2.2` - TypeScript
- `vite@^5.0.8` - Build tool

## 🎯 Features

### Ticket Management

- ✅ Create, read, update, delete tickets
- ✅ Status transitions with workflow validation
- ✅ Assignment and reassignment
- ✅ Filtering by status, priority, type, tag, creator
- ✅ Search functionality with debouncing
- ✅ Pagination
- ✅ Export to CSV
- ✅ Tag management (add/remove tags)
- ✅ Ticket cloning
- ✅ Ticket history timeline

### Comments

- ✅ Create comments
- ✅ Threaded comments (reply to comments)
- ✅ Nested comment display
- ✅ Activity log integration

### Attachments

- ✅ Upload files
- ✅ Download files
- ✅ Delete files
- ✅ File type validation
- ✅ File size limits

### Notifications

- ✅ In-app notification center
- ✅ Real-time notification updates
- ✅ Mark as read functionality
- ✅ Unread count badge

### User Management

- ✅ List users
- ✅ Create users (Admin/Manager)
- ✅ Update users (Admin/Manager)
- ✅ Delete users (Admin/Manager)
- ✅ Role and designation management

### Analytics

- ✅ Dashboard with metrics
- ✅ Status breakdown
- ✅ Priority distribution
- ✅ Recent tickets

### Tags

- ✅ Tag management (Admin/Manager)
- ✅ Add/remove tags from tickets
- ✅ Tag filtering
- ✅ Color-coded tags
- ✅ Tag statistics

### User Preferences

- ✅ Theme selection (light/dark/system)
- ✅ Notification preferences
- ✅ Language preferences
- ✅ Default filters

## 🐛 Troubleshooting

### Build Errors

- Clear cache and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version: `node --version` (should be 18+)
- Check for TypeScript errors: `npm run build`

### API Connection Issues

- Verify backend is running on port 8000
- Check `VITE_API_URL` in `.env` file
- Check browser console for CORS errors
- Verify backend CORS configuration includes frontend URL

### Port Already in Use

- Use a different port: `npm run dev -- --port 5174`
- Find and stop the process using port 5173

### Environment Variables Not Working

- Ensure variables are prefixed with `VITE_`
- Restart dev server after changing `.env`
- Check for typos in variable names

### TypeScript Errors

- Run `npm run build` to see all TypeScript errors
- Check `tsconfig.json` configuration
- Ensure all types are properly imported

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8000` |

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Deploy to Static Hosting

The `dist/` directory can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any web server

### Environment Configuration

For production, set `VITE_API_URL` to your production API URL:
```env
VITE_API_URL=https://api.yourdomain.com
```

## 📄 License

Internal use only - IVAID Atlas

## 📞 Support

For issues or questions, contact the development team.

---

**IVAID Atlas Frontend** - Professional Issue Tracking UI





