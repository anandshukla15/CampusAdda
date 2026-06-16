import { useEffect, useState } from "react";
import socket from "../services/socket";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (data) => {
      const id = Date.now();
      const notification = { id, ...data };
      setNotifications((prev) => [...prev, notification]);

      // Auto remove notification after 6 seconds
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
        return "bg-green-500 border-l-4 border-green-700 text-white";
      case "president_removed":
        return "bg-red-500 border-l-4 border-red-700 text-white";
      case "president_application":
        return "bg-blue-500 border-l-4 border-blue-700 text-white";
      default:
        return "bg-gray-500 border-l-4 border-gray-700 text-white";
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
        return "ℹ";
      default:
        return "●";
    }
  };

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 w-96 max-w-full px-4">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`p-4 rounded shadow-lg animate-fadeIn ${getNotificationStyles(
            notif.type
          )}`}
        >
          <div className="flex items-start gap-3">
            <span className="text-xl font-bold flex-shrink-0">{getNotificationIcon(notif.type)}</span>
            <div className="flex-1">
              <p className="font-semibold">{getNotificationTitle(notif.type)}</p>
              <p className="text-sm mt-1 opacity-90">{notif.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
