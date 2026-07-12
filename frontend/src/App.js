import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Nav from "./components/Nav";
import NotificationCenter from "./components/NotificationCenter";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const PresidentDashboard = lazy(() => import("./pages/PresidentDashboard"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const SavedEvents = lazy(() => import("./pages/SavedEvents"));
const RegisteredEvents = lazy(() => import("./pages/RegisteredEvents"));
const OAuthSuccess = lazy(() => import("./pages/OAuthSuccess"));

function DebugRoute() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return null;
}

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white/90 p-6 text-center shadow-xl shadow-slate-900/10 backdrop-blur">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-cyan-400 to-slate-900" />
        <p className="mt-4 text-base font-semibold text-slate-950">Loading Campus Adda</p>
        <p className="mt-1 text-sm text-slate-500">Preparing a faster view for this section.</p>
      </div>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <DebugRoute />
      <NotificationCenter />
      <Nav />
      <div className="min-h-screen bg-gray-100">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/events/:id" element={<EventDetails />} />
            <Route path="/oauth-success" element={<OAuthSuccess />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registered"
              element={
                <ProtectedRoute role="user">
                  <RegisteredEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/president"
              element={
                <ProtectedRoute>
                  <PresidentDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;