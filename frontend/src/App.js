import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import PresidentDashboard from "./pages/PresidentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Nav from "./components/Nav";

function App() {
  return (
    <BrowserRouter>
      <Nav />
      <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/president" element={
          <ProtectedRoute role="president">
            <PresidentDashboard />
          </ProtectedRoute>
        } />
      </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;