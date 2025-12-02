import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";

const NotificationContext = createContext(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const location = useLocation();
  const isOnReviewsPage = location.pathname === "/admin/reviews";

  useEffect(() => {
    // Only initialize socket for admin pages
    if (!location.pathname.startsWith("/admin")) {
      return;
    }

    // Initialize socket connection (only once)
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io("http://localhost:8000");
      const socket = socketRef.current;

      // Register with admin room when connected
      socket.on("connect", () => {
        console.log("Notification socket connected:", socket.id);
        socket.emit("joinAdmin");
      });

      // Listen for admin notifications (single source of truth for menu notifications)
      socket.on("notification", (notification) => {
        console.log("Admin notification received:", notification);

        // Check current pathname when notification arrives
        const currentPath = window.location.pathname;
        const isOnReviews = currentPath === "/admin/reviews";

        // Only add review notifications if not on reviews page
        if (notification.type === "review" && !isOnReviews) {
          const newNotification = {
            id: notification.id || `review-${Date.now()}`,
            title: notification.title || "New Review Submitted",
            message:
              notification.message ||
              "A new review has been submitted",
            type: "review",
            reviewId: notification.reviewId,
            createdAt: notification.createdAt || new Date(),
            isRead: false,
          };

          setNotifications((prev) => {
            // Check if notification already exists
            const exists = prev.some((n) => n.id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
      });

      // We still listen for `new_review` elsewhere (e.g. in the Reviews page)
      // to update the list in real time, but we do NOT create a menu
      // notification here to avoid duplicates.
      socket.on("new_review", (review) => {
        console.log("New review event received:", review);
        // Intentionally no notification creation here.
      });
    }

    // Cleanup on unmount (only disconnect when leaving admin area)
    return () => {
      if (!location.pathname.startsWith("/admin") && socketRef.current) {
        socketRef.current.off("notification");
        socketRef.current.off("new_review");
        socketRef.current.off("connect");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [location.pathname]);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  // Clear notifications
  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Get unread notifications count
  const hasUnread = unreadCount > 0;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

