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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasMore: true,
    loading: false,
  });
  const socketRef = useRef(null);
  const location = useLocation();
  const envBase = import.meta.env.VITE_API_BASE_URL;
  const BASE_URL = envBase || `${window.location.protocol}//${window.location.hostname}:5000`;
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || BASE_URL;

  // Fetch notifications function
  const fetchNotifications = async (page = 1, append = false) => {
    try {
      setPagination(prev => ({ ...prev, loading: true }));
      const url = `${BASE_URL.replace(/\/$/, "")}/api/notifications?page=${page}&limit=20`;
      const res = await fetch(url, { credentials: "include" });
      const json = await res.json();
      
      if (json && json.notifications && Array.isArray(json.notifications)) {
        const normalized = json.notifications.map((n) => ({ ...n, id: n._id || n.id }));
        
        if (append) {
          setNotifications(prev => [...prev, ...normalized]);
        } else {
          setNotifications(normalized);
        }
        
        // Handle pagination data safely with defaults
        const paginationData = json.pagination || {};
        setPagination({
          page: paginationData.page || page,
          limit: paginationData.limit || 20,
          hasMore: paginationData.hasMore !== false,
          loading: false,
        });
        
        // Update unread count
        const allNotifications = append ? [...notifications, ...normalized] : normalized;
        setUnreadCount(allNotifications.filter((n) => !n.isRead).length);
      } else {
        // Handle unexpected response format
        setPagination({
          page,
          limit: 20,
          hasMore: false,
          loading: false,
        });
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications", err);
      setPagination(prev => ({ ...prev, loading: false, hasMore: false }));
    }
  };

  // Load more notifications function (for infinite scroll)
  const loadMoreNotifications = () => {
    if (pagination.loading || !pagination.hasMore) return;
    
    const nextPage = pagination.page + 1;
    fetchNotifications(nextPage, true);
  };

  useEffect(() => {
    // Only initialize socket for admin pages
    if (!location.pathname.startsWith("/admin")) {
      return;
    }

    // Fetch initial notifications
    fetchNotifications();

    // Initialize socket connection (only once)
    if (!socketRef.current || !socketRef.current.connected) {
      socketRef.current = io(SOCKET_URL);
      const socket = socketRef.current;

      // Register with admin room when connected
      socket.on("connect", () => {
        socket.emit("joinAdmin");
      });

      // Listen for admin notifications
      socket.on("notification", (notification) => {
        console.log("Admin notification received:", notification);

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
            message: notification.message || "A new reward has been submitted",
            type: "reward",
            rewardId: notification.rewardId,
            createdAt: notification.createdAt || new Date(),
            isRead: false,
          };
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
          });
          setUnreadCount((prev) => prev + 1);
        }
      });
    }

    // Cleanup on unmount
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
        let res = await fetch(`${BASE_URL}/api/notifications/${notificationId}/read`, { 
          method: "PATCH", 
          credentials: "include" 
        });
        if (res.status === 404) {
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
            let res = await fetch(`${BASE_URL}/api/notifications/${n._id || n.id}/read`, { 
              method: "PATCH", 
              credentials: "include" 
            });
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
        pagination,
        loadMoreNotifications, 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};