// src/pages/OAuthSuccess.js

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/decodeToken";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  // Save token only if present
  if (token) {
    localStorage.setItem("token", token);
  }

  const user = getUser();

  console.log("OAuth user:", user);

  if (!user) {
    navigate("/login");
    return;
  }

  if (user.role === "admin") {
    navigate("/admin", { replace: true });
  } else if (user.role === "president") {
    navigate("/president", { replace: true });
  } else {
    navigate("/", { replace: true });
  }
}, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      Logging you in...
    </div>
  );
}