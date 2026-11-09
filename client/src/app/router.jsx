import { createBrowserRouter } from 'react-router-dom';
import { RouteError } from '@/components/common/RouteError';
import { Splash } from '@/components/common/Splash';
import AppShell from '@/components/layout/AppShell';
import AuthLayout from '@/components/layout/AuthLayout';
import SessionLayout from '@/components/layout/SessionLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/features/auth/ProtectedRoute';

// Every page is loaded with lazy(): its code is downloaded only when the route is first visited
// (route-based code splitting), which keeps the first load small. Each page module exports `Component`.
const authRoutes = [
  { path: '/login', lazy: () => import('@/features/auth/LoginPage') },
  { path: '/register', lazy: () => import('@/features/auth/RegisterPage') },
];

const appRoutes = [
  { index: true, lazy: () => import('@/features/feedback/DashboardPage') },
  { path: 'categories', lazy: () => import('@/features/categories/CategoriesPage') },
  { path: 'book', lazy: () => import('@/features/booking/BookingPage') },
  { path: 'interviews', lazy: () => import('@/features/interviews/InterviewsPage') },
  { path: 'interviews/:id', lazy: () => import('@/features/interviews/InterviewDetailPage') },
  { path: 'interviews/:id/feedback', lazy: () => import('@/features/feedback/FeedbackDetailPage') },
  { path: 'resumes', lazy: () => import('@/features/resume/ResumePage') },
];

const sessionRoutes = [{ path: 'interviews/:id/session', lazy: () => import('@/features/session/SessionPage') }];

// Layout routes (no path) wrap their children: ProtectedRoute guards everything inside it, AppShell adds the
// sidebar, and <Outlet /> marks where the matched child page renders. :id is a dynamic route parameter.
export const routes = [
  {
    HydrateFallback: Splash,
    ErrorBoundary: RouteError,
    children: [
      { element: <PublicOnlyRoute />, children: [{ element: <AuthLayout />, children: authRoutes }] },
      {
        element: <ProtectedRoute />,
        children: [
          { element: <AppShell />, children: appRoutes },
          { element: <SessionLayout />, children: sessionRoutes },
        ],
      },
      { path: '*', lazy: () => import('@/pages/NotFoundPage') },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(routes);
