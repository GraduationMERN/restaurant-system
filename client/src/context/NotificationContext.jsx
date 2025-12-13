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
  const envBase = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = envBase || `${window.location.protocol}//${window.location.hostname}:5000`;
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BASE_URL;
  useEffect(() => {
    // Only initialize socket for admin pages
    if (!location.pathname.startsWith("/admin")) {
      return;
    }

    // Fetch persisted notifications for admin area
    const fetchNotifications = async () => {
      try {
        const url = BASE_URL.replace(/\/$/, "") + "/api/notifications";
        const res = await fetch(url, { credentials: "include" });
        const json = await res.json();
        if (json && json.notifications) {
          // Normalize ids and set as current notifications
          const normalized = json.notifications.map((n) => ({ ...n, id: n._id || n.id }));
          setNotifications(normalized);
          setUnreadCount(normalized.filter((n) => !n.isRead).length);
        }
      } catch (err) {
        console.error("Failed to fetch admin notifications", err);
      }
    };
    fetchNotifications();

    // Initialize socket connection (only once)
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(SOCKET_URL);
      const socket = socketRef.current;

      // Register with admin room when connected
      socket.on("connect", () => {
        socket.emit("joinAdmin");
      });

      // Listen for admin notifications (single source of truth for menu notifications)
      socket.on("notification", (notification) => {
        console.log("Admin notification received:", notification);

        // Check current pathname when notification arrives
        const currentPath = window.location.pathname;
        const isOnReviews = currentPath === "/admin/reviews";
        const isOnReward = currentPath === "/admin/reward-orders";
        // Only add review notifications if not on reviews page
        if (notification.type === "review" && !isOnReviews) {
          const newNotification = {
            id: notification._id || notification.id || `review-${Date.now()}`,
            title: notification.title || "New Review Submitted",
            message: notification.message || "A new review has been submitted",
            type: "review",
            reviewId: notification.reviewId,
            createdAt: notification.createdAt || new Date(),
            isRead: false,
          };
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotification.id || n._id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
          if (notification.type === "reward" && !isOnReward) {
          const newNotification = {
              id: notification._id || notification.id || `Reward-${Date.now()}`,
            title: notification.title || "Reward Redeemed",
            message:
              notification.message ||
              "A new reward has been submitted",
            type: "reward",
            rewardId: notification.rewardId,
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
      prev.map((n) => (n.id === notificationId || n._id === notificationId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Persist mark as read to server
    (async () => {
      try {
        // Try the conventional endpoint first
        let res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, { method: "PATCH", credentials: "include" });
        if (res.status === 404) {
          // Fallback: some backends expect a read endpoint that accepts body
          res = await fetch(`${BASE_URL}/api/notifications/read`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: notificationId }),
          });
        }
        if (!res.ok) {
          console.warn("markAsRead returned non-ok status", res.status);
        }
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    })();
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    // Persist marks for all unread notifications
    (async () => {
      try {
        const unread = notifications.filter((n) => !n.isRead);
        await Promise.all(
          unread.map(async (n) => {
            let res = await fetch(`${BASE_URL}/api/notifications/${n._id || n.id}/read`, { method: "PATCH", credentials: "include" });
            if (res.status === 404) {
              res = await fetch(`${BASE_URL}/api/notifications/read`, {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: n._id || n.id }),
              });
            }
            if (!res.ok) console.warn("markAllAsRead item returned non-ok", res.status);
          })
        );
      } catch (err) {
        console.error("Failed to mark all notifications as read", err);
      }
    })();
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

