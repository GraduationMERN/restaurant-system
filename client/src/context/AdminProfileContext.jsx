import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

const AdminProfileContext = createContext(null);

export function AdminProfileProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch admin profile
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/admin/profile");
      if (res.data?.profile) {
        setProfile(res.data.profile);
      }
    } catch (err) {
      console.error("Failed to fetch admin profile:", err);
      setError(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data) => {
    try {
      const res = await api.put("/api/admin/profile", data);
      if (res.data?.profile) {
        setProfile(res.data.profile);
        return { success: true, profile: res.data.profile };
      }
      return { success: false };
    } catch (err) {
      console.error("Failed to update admin profile:", err);
      return { success: false, error: err.response?.data?.message || "Failed to update" };
    }
  }, []);

  // Upload avatar
  const uploadAvatar = useCallback(async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      
      const res = await api.post("/api/admin/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (res.data?.profile) {
        setProfile(res.data.profile);
        return { success: true, avatarUrl: res.data.avatarUrl };
      }
      return { success: false };
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      return { success: false, error: err.response?.data?.message || "Failed to upload" };
    }
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const value = {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
  };

  return (
    <AdminProfileContext.Provider value={value}>
      {children}
    </AdminProfileContext.Provider>
  );
}

export function useAdminProfile() {
  const context = useContext(AdminProfileContext);
  if (!context) {
    throw new Error("useAdminProfile must be used within an AdminProfileProvider");
  }
  return context;
}

export default AdminProfileContext;
