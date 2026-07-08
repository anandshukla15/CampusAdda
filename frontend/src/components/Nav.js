import { NavLink, useNavigate } from "react-router-dom";
import { getUser } from "../utils/decodeToken";
import { useEffect, useState } from "react";
import socket from "../services/socket";
import API from "../services/api";

export default function Nav() {
  const navigate = useNavigate();
  const user = getUser();
  const userId = user?.id;
  const userRole = user?.role;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const activeClass = ({ isActive }) =>
    isActive
      ? "text-green-600 font-semibold"
      : "text-gray-700 hover:text-gray-900";

  useEffect(() => {
    // register socket with server so it can join user and role rooms
    if (userId && socket) {
      socket.emit('register', { userId, role: userRole });

      socket.on('notification', (payload) => {
        // prepend notification
        setNotifications((prev) => [payload, ...prev]);
        setUnreadCount((c) => c + 1);
      });
    }

    // fetch existing notifications
    const fetchNotifications = async () => {
      if (!userId) return;
      try {
        const res = await API.get('/notifications');
        setNotifications(res.data || []);
        const unread = (res.data || []).filter((n) => n.is_read === 0).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };

    fetchNotifications();

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [userId, userRole]);

  return (
    <nav className="bg-white shadow px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-3">
      <div className="text-xl font-bold">Campus Adda</div>

      <div className="flex flex-wrap items-center gap-4">
        <NavLink to="/" className={activeClass}>
          <span className="inline-flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.75z" />
            </svg>
            Home
          </span>
        </NavLink>

        <NavLink to="/saved" className={activeClass}>
          Saved
        </NavLink>

        {user && user.role === "user" && (
          <NavLink to="/registered" className={activeClass}>
            Registered Events
          </NavLink>
        )}

        {user && (
          <NavLink to="/profile" className={activeClass}>
            <span className="inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9 9 0 1118.879 6.196 9 9 0 015.121 17.804z" />
                <path strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Profile
            </span>
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
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setOpen(!open)} className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full px-1 text-xs">{unreadCount}</span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50">
                  <div className="p-2 max-h-64 overflow-auto">
                    {notifications.length === 0 ? (
                      <div className="text-sm text-gray-600">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className={`p-2 border-b ${n.is_read ? 'bg-white' : 'bg-gray-50'}`}>
                          <div className="text-sm font-medium">{n.type}</div>
                          <div className="text-sm text-gray-700">{n.message}</div>
                          <div className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={logout} className="text-red-600">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}