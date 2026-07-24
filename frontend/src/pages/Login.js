import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { getUser } from "../utils/decodeToken";
import { useLocation } from "react-router-dom";
export default function Login() {
  const location = useLocation();

  console.log("LOGIN PAGE RENDERED");
  console.trace("Who rendered login?");
  console.log("PATH:", location.pathname);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", form);

      localStorage.setItem("token", res.data.token);

      const user = getUser();

      if (user?.role === "admin") navigate("/admin");
      else if (
        user?.role === "president" ||
        user?.role === "pending_president"
      )
        navigate("/president");
      else navigate("/");
    } catch (err) {
      setError(err?.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };
const handleGoogleLogin = () => {
    window.location.href =
        `${process.env.REACT_APP_API_URL}/auth/google`;
};

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold text-center mb-6">
        Welcome Back
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-600 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label className="block text-sm mb-1">
          Email
        </label>
        <input
          type="email"
          placeholder="Enter email"
          className="w-full border p-3 mb-4 rounded"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <label className="block text-sm mb-1">
          Password
        </label>
        <input
          type="password"
          placeholder="Enter password"
          className="w-full border p-3 mb-4 rounded"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-medium"
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t"></div>
        <span className="px-3 text-gray-500 text-sm">
          OR
        </span>
        <div className="flex-1 border-t"></div>
      </div>

      {/* Google Login */}
      <button
        onClick={handleGoogleLogin}
        className="w-full border border-gray-300 py-3 rounded flex items-center justify-center gap-3 hover:bg-gray-50"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="w-5 h-5"
        />
        Continue with Google
      </button>

      <p className="text-center text-sm text-gray-500 mt-5">
        Don't have an account?
        <a
          href="/register"
          className="text-blue-600 ml-1 hover:underline"
        >
          Register
        </a>
      </p>
    </div>
  );
}