import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import PresidentDashboard from "./pages/PresidentDashboard";
import EventDetails from "./pages/EventDetails";
import Profile from "./pages/Profile";
import SavedEvents from "./pages/SavedEvents";
import ProtectedRoute from "./components/ProtectedRoute";
import Nav from "./components/Nav";
import NotificationCenter from "./components/NotificationCenter";

function App() {
  return (
    <BrowserRouter>
      <NotificationCenter />
      <Nav />
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/saved" element={
            <ProtectedRoute>
              <SavedEvents />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/president" element={
            <ProtectedRoute>
              <PresidentDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;