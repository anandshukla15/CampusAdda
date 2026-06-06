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
    <nav className="bg-white shadow px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
      <div className="text-xl font-bold">Campus Adda</div>
      <div className="flex flex-wrap items-center gap-4 text-gray-700">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <Link to="/saved" className="hover:text-gray-900">Saved</Link>
        {user && <Link to="/profile" className="hover:text-gray-900">Profile</Link>}
        {!user && <Link to="/login" className="hover:text-gray-900">Login</Link>}
        {!user && <Link to="/register" className="hover:text-gray-900">Register</Link>}
        {user && (
          <Link to="/president" className="hover:text-gray-900">President</Link>
        )}
        {user && user.role === "admin" && (
          <Link to="/admin" className="hover:text-gray-900">Admin</Link>
        )}
        {user && (
          <button onClick={logout} className="text-red-600">Logout</button>
        )}
      </div>
    </nav>
  );
}
