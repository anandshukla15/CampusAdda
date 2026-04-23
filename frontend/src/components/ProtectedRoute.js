import { Navigate } from "react-router-dom";
import { getUser } from "../utils/decodeToken";

export default function ProtectedRoute({ children, role }) {
  const user = getUser();

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;

  return children;
}