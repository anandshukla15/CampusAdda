import { NavLink, useNavigate } from "react-router-dom";
import { getUser } from "../utils/decodeToken";

export default function Nav() {
  const navigate = useNavigate();
  const user = getUser();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const activeClass = ({ isActive }) =>
    isActive
      ? "text-green-600 font-semibold"
      : "text-gray-700 hover:text-gray-900";

  return (
    <nav className="bg-white shadow px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
      <div className="text-xl font-bold">Campus Adda</div>

      <div className="flex flex-wrap items-center gap-4">
        <NavLink to="/" className={activeClass}>
          Home
        </NavLink>

        <NavLink to="/saved" className={activeClass}>
          Saved
        </NavLink>

        {user && (
          <NavLink to="/profile" className={activeClass}>
            Profile
          </NavLink>
        )}

        {!user && (
          <NavLink to="/login" className={activeClass}>
            Login
          </NavLink>
        )}

        {!user && (
          <NavLink to="/register" className={activeClass}>
            Register
          </NavLink>
        )}

        {user && (
          <NavLink to="/president" className={activeClass}>
            President
          </NavLink>
        )}

        {user && user.role === "admin" && (
          <NavLink to="/admin" className={activeClass}>
            Admin
          </NavLink>
        )}

        {user && (
          <button onClick={logout} className="text-red-600">
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}