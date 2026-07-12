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
  const [menuOpen, setMenuOpen] = useState(false);

  const dismissNotification = async (notificationId) => {
    try {
      await API.post(`/notifications/mark-read/${notificationId}`);
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
      setUnreadCount((count) => Math.max(count - 1, 0));
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const activeClass = ({ isActive }) =>
    isActive
      ? "text-cyan-700 font-semibold"
      : "text-slate-600 hover:text-slate-950";

  useEffect(() => {
    // register socket with server so it can join user and role rooms
    if (userId && socket) {
      socket.emit('register', { userId, role: userRole });

      socket.on('notification', () => {
        fetchNotifications();
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
    <nav className="sticky top-0 z-[70] border-b border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-bold tracking-tight text-slate-950">Campus Adda</div>
            <p className="text-xs text-slate-500">Discover, register, and manage campus events</p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-3 py-2 text-slate-700 md:hidden"
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>

        <div className={`flex flex-col gap-3 md:flex md:flex-row md:flex-wrap md:items-center md:gap-4 ${menuOpen ? "flex" : "hidden md:flex"}`}>
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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
            <div className="relative self-start md:self-auto">
              <button onClick={() => setOpen(!open)} className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full px-1 text-xs">{unreadCount}</span>
                )}
              </button>

              {open && (
                <div className="absolute right-0 z-50 mt-3 w-[92vw] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-950">Notifications</p>
                    <p className="text-xs text-slate-500">Recent updates and reminders</p>
                  </div>
                  <div className="max-h-80 overflow-auto p-2">
                    {notifications.length === 0 ? (
                      <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No notifications</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => dismissNotification(n.id)}
                          className={`cursor-pointer rounded-2xl border px-3 py-3 transition ${n.is_read ? 'border-transparent bg-white' : 'border-cyan-100 bg-cyan-50/80 hover:bg-cyan-100/90'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-950">{n.type}</div>
                              <div className="mt-1 text-sm leading-6 text-slate-600">{n.message}</div>
                            </div>
                            <span className="rounded-full bg-white px-2 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">{n.is_read ? 'Read' : 'New'}</span>
                          </div>
                          <div className="mt-2 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={logout} className="rounded-2xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
              Logout
            </button>
          </div>
        )}
        </div>
      </div>
    </nav>
  );
}