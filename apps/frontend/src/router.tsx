import { createBrowserRouter } from 'react-router';
import { MapView } from './map/MapView';
import { NotFound } from './NotFound';
import { RegisterLoginPage } from './seeker/RegisterLoginPage';

// Library/Classic SPA mode (not framework mode) — `createBrowserRouter` +
// `RouterProvider` from `react-router/dom` in main.tsx. `/register` and
// `/login` share one component; RegisterLoginPage reads the path to decide
// its initial mode. Epic 2's later stories (profile, applications) add more
// routes under /seeker.
export const router = createBrowserRouter([
  { path: '/', element: <MapView /> },
  { path: '/register', element: <RegisterLoginPage /> },
  { path: '/login', element: <RegisterLoginPage /> },
  { path: '*', element: <NotFound /> },
]);
