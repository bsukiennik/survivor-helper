import { createBrowserRouter } from 'react-router';
import { MapView } from './map/MapView';
import { NotFound } from './NotFound';
import { BadgesPage } from './seeker/BadgesPage';
import { MyApplicationsPage } from './seeker/MyApplicationsPage';
import { ProfilePage } from './seeker/ProfilePage';
import { RegisterLoginPage } from './seeker/RegisterLoginPage';

// Library/Classic SPA mode (not framework mode) — `createBrowserRouter` +
// `RouterProvider` from `react-router/dom` in main.tsx. `/register` and
// `/login` share one component; RegisterLoginPage reads the path to decide
// its initial mode.
export const router = createBrowserRouter([
  { path: '/', element: <MapView /> },
  { path: '/register', element: <RegisterLoginPage /> },
  { path: '/login', element: <RegisterLoginPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/badges', element: <BadgesPage /> },
  { path: '/applications', element: <MyApplicationsPage /> },
  { path: '*', element: <NotFound /> },
]);
