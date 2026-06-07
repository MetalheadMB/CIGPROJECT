import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import ToastStack from './components/ToastStack.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Events from './pages/Events.jsx';
import EventDetail from './pages/EventDetail.jsx';
import MediaDetail from './pages/MediaDetail.jsx';
import Search from './pages/Search.jsx';
import Favorites from './pages/Favorites.jsx';
import Notifications from './pages/Notifications.jsx';
import Admin from './pages/Admin.jsx';

// AI-heavy pages (TensorFlow.js + face-api) are code-split so the libraries
// only download when the user actually opens upload / face-matching screens.
const Upload = lazy(() => import('./pages/Upload.jsx'));
const MyPhotos = lazy(() => import('./pages/MyPhotos.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));

function Protected({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingBottom: 60 }}>
        <Suspense fallback={<div className="spinner" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/m/:id" element={<MediaDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<Protected roles={['ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER']}><Upload /></Protected>} />
          <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
          <Route path="/my-photos" element={<Protected><MyPhotos /></Protected>} />
          <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/admin" element={<Protected roles={['ADMIN']}><Admin /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <ToastStack />
    </>
  );
}
