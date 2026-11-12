import { useEffect } from 'react';
import { createHashRouter, Navigate, Outlet, RouterProvider, useLocation, useParams } from 'react-router-dom';
import { Crash } from './components/Crash';
import { AppShell } from './components/Shell';
import { Toaster } from './components/ui';
import { reconcileStreak, storageNotice, useProgress } from './lib/store';
import { Blitz } from './pages/Blitz';
import { ClueDrillRoute } from './pages/ClueDrill';
import { Home } from './pages/Home';
import { Landing } from './pages/Landing';
import { OnboardingPage } from './pages/Onboarding';
import { Learn } from './pages/Learn';
import { LessonPlayer } from './pages/LessonPlayer';
import { Mock } from './pages/Mock';
import { Patterns } from './pages/Patterns';
import { ProblemDetail } from './pages/ProblemDetail';
import { ProblemLessonRoute } from './pages/ProblemLesson';
import { Problems } from './pages/Problems';
import { Profile } from './pages/Profile';
import { RebuildRoute } from './pages/Rebuild';
import { Review } from './pages/Review';
import { Science } from './pages/Science';
import { SolveRoute } from './pages/Solve';
import { TemplateDrillRoute } from './pages/TemplateDrill';
import { Unit } from './pages/Unit';

// Re-mount lesson players when the route param changes so state starts fresh.
function FoundationRoute() {
  const { lessonId } = useParams();
  return <LessonPlayer key={lessonId} mode="foundation" />;
}
function GuideRoute() {
  const { cat } = useParams();
  return <LessonPlayer key={cat} mode="guide" />;
}

function Root() {
  const { settings, onboarded } = useProgress();
  const theme = settings.theme;
  const loc = useLocation();
  useEffect(() => {
    const el = document.documentElement;
    if (theme === 'system') el.removeAttribute('data-theme');
    else el.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => {
    storageNotice();
    reconcileStreak();
    const onVis = () => document.visibilityState === 'visible' && reconcileStreak();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  // First-time visitors land on the marketing page; everyone else gets the dashboard.
  if (!onboarded && loc.pathname === '/') return <Navigate to="/welcome" replace />;
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}

const router = createHashRouter([
  {
    element: <Root />,
    // A screen that throws shows this instead of a blank page.
    errorElement: <Crash />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: '/', element: <Home /> },
          { path: '/learn', element: <Learn /> },
          { path: '/unit/:cat', element: <Unit /> },
          { path: '/p/:id', element: <ProblemDetail /> },
          { path: '/patterns', element: <Patterns /> },
          { path: '/problems', element: <Problems /> },
          { path: '/profile', element: <Profile /> },
          { path: '/science', element: <Science /> },
          { path: '/mock', element: <Mock /> },
        ],
      },
      // Marketing + onboarding (no app chrome).
      { path: '/welcome', element: <Landing /> },
      { path: '/onboarding', element: <OnboardingPage /> },
      // Focus-mode sessions (no navigation chrome).
      { path: '/foundations/:lessonId', element: <FoundationRoute /> },
      { path: '/unit/:cat/intro', element: <GuideRoute /> },
      { path: '/p/:id/learn', element: <ProblemLessonRoute /> },
      { path: '/p/:id/rebuild', element: <RebuildRoute /> },
      { path: '/p/:id/solve', element: <SolveRoute /> },
      { path: '/patterns/:cat/type', element: <TemplateDrillRoute /> },
      { path: '/review', element: <Review /> },
      { path: '/blitz', element: <Blitz /> },
      { path: '/clues', element: <ClueDrillRoute /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
