import { Navigate } from "react-router-dom";
import { getUser } from "../utils/decodeToken";

export default function ProtectedRoute({ children, role }) {
  const user = getUser();
  const roles = Array.isArray(role) ? role : [role];

  if (!user) return <Navigate to="/login" />;
  if (role && !roles.includes(user.role)) return <Navigate to="/" />;

  return children;
}