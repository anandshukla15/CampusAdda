import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../utils/decodeToken";

export default function Nav() {
  const navigate = useNavigate();
  const user = getUser();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow px-6 py-3 flex justify-between items-center">
      <div className="text-xl font-bold">Campus Adda</div>
      <div className="flex items-center gap-4">
        <Link to="/" className="text-gray-700 hover:text-gray-900">Home</Link>
        {!user && <Link to="/login" className="text-gray-700 hover:text-gray-900">Login</Link>}
        {!user && <Link to="/register" className="text-gray-700 hover:text-gray-900">Register</Link>}
        {user && user.role === "admin" && (
          <Link to="/admin" className="text-gray-700 hover:text-gray-900">Admin</Link>
        )}
        {user && user.role === "president" && (
          <Link to="/president" className="text-gray-700 hover:text-gray-900">President</Link>
        )}
        {user && (
          <button onClick={logout} className="text-red-600">Logout</button>
        )}
      </div>
    </nav>
  );
}
