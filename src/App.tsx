import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/Toast';
import { PageTitle } from './components/PageTitle';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useAuthStore } from './store/auth';
import { useToastStore } from './store/toast';

// Lazy load all page components for code splitting
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const TicketList = lazy(() => import('./pages/TicketList').then(module => ({ default: module.TicketList })));
const TicketDetail = lazy(() => import('./pages/TicketDetail').then(module => ({ default: module.TicketDetail })));
const CreateTicket = lazy(() => import('./pages/CreateTicket').then(module => ({ default: module.CreateTicket })));
const ActiveSprints = lazy(() => import('./pages/ActiveSprints').then(module => ({ default: module.ActiveSprints })));
const Users = lazy(() => import('./pages/Users').then(module => ({ default: module.Users })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const TagManagement = lazy(() => import('./pages/TagManagement').then(module => ({ default: module.TagManagement })));
const TagStatistics = lazy(() => import('./pages/TagStatistics').then(module => ({ default: module.TagStatistics })));
const TicketTemplates = lazy(() => import('./pages/TicketTemplates').then(module => ({ default: module.TicketTemplates })));
const Projects = lazy(() => import('./pages/Projects').then(module => ({ default: module.Projects })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(module => ({ default: module.ProjectDetail })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <div className="text-center animate-fade-in">
      <LoadingSpinner size="lg" variant="spinner" />
      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading page...</p>
    </div>
  </div>
);

function App() {
  const { isAuthenticated } = useAuthStore();
  const { toasts, removeToast } = useToastStore();

  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <PageTitle />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <div className="page-transition-enter-active">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route
                path="/login"
                element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
              />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Navigate to="/dashboard" replace />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TicketList />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/new"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CreateTicket />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tickets/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TicketDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sprints"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ActiveSprints />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Users />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Profile />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Settings />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tags"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TagManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tags/statistics"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TagStatistics />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <TicketTemplates />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Projects />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ProjectDetail />
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

