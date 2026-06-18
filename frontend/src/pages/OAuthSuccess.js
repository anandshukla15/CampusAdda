// src/pages/OAuthSuccess.js

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/decodeToken";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get("token");

//      console.log("OAuth page loaded");
//   console.log("Token:", token);

    if (!token) {
      navigate("/login");
      return;
    }

    localStorage.setItem("token", token);
    //console.log("STORED TOKEN:", localStorage.getItem("token"));

    const user = getUser();
    console.log("decode user",getUser());

    if (user?.role === "admin") {
        console.log("navigate admin");
      navigate("/admin");
    } else if (user?.role === "president") {
        console.log("navigate president");
      navigate("/president");
    } else {
        console.log("navigate home");
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      Logging you in...
    </div>
  );
}