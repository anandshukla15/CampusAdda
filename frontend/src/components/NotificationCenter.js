import { useEffect, useState } from "react";
import socket from "../services/socket";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (data) => {
      const id = Date.now();
      const notification = { id, ...data };
      setNotifications((prev) => [...prev, notification]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
    };
  }, []);

  const getNotificationStyles = (type) => {
    switch (type) {
      case "president_approved":
        return "border-emerald-200 bg-emerald-50 text-emerald-950 shadow-emerald-900/10";
      case "president_removed":
        return "border-rose-200 bg-rose-50 text-rose-950 shadow-rose-900/10";
      case "president_application":
        return "border-sky-200 bg-sky-50 text-sky-950 shadow-sky-900/10";
      case "new_event":
        return "border-cyan-200 bg-cyan-50 text-cyan-950 shadow-cyan-900/10";
      default:
        return "border-slate-200 bg-white text-slate-900 shadow-slate-900/10";
    }
  };

  const getNotificationTitle = (type) => {
    switch (type) {
      case "president_approved":
        return "President Application Approved!";
      case "president_removed":
        return "President Role Removed";
      case "president_application":
        return "New President Application";
      case "new_event":
        return "New Event Added";
      default:
        return "Notification";
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "president_approved":
        return "✓";
      case "president_removed":
        return "✕";
      case "president_application":
        return "i";
      case "new_event":
        return "★";
      default:
        return "•";
    }
  };

  return (
    <div className="fixed right-4 top-4 z-[80] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:w-96">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`cursor-pointer overflow-hidden rounded-3xl border px-4 py-4 shadow-2xl backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:shadow-3xl ${getNotificationStyles(notif.type)}`}
          onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id))}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-white/80 text-lg font-bold ring-1 ring-black/5">
              {getNotificationIcon(notif.type)}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold sm:text-base">{getNotificationTitle(notif.type)}</p>
                <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-500">New</span>
              </div>
              <p className="mt-1 text-sm leading-6 text-current/80">{notif.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
