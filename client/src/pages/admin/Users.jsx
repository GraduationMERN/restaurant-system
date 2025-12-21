import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, updateUserRole, deleteUser } from "../../redux/slices/usersSlice";
import { registerUser } from "../../redux/slices/authSlice";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../hooks/useToast";
import { Plus, X, User, Mail, Phone, Shield, ChevronDown, Loader2, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const validateField = (name, value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^[\d\s\-+()]{10,}$/;

  switch (name) {
    case "name":
      if (!value.trim()) return "Name is required";
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      return "";

    case "email":
      if (!value) return "Email is required";
      if (!emailRegex.test(value)) return "Please enter a valid email";
      return "";

    case "password":
      if (!value) return "Password is required";
      if (value.length < 8) return "Password must be at least 8 characters";
      if (!/(?=.*[a-z])/.test(value))
        return "Password must contain a lowercase letter";
      if (!/(?=.*[A-Z])/.test(value))
        return "Password must contain an uppercase letter";
      if (!/(?=.*\d)/.test(value)) return "Password must contain a number";
      return "";

    case "phoneNumber":
      if (!value) return "Phone number is required";
      if (!phoneRegex.test(value)) return "Please enter a valid phone number";
      return "";

    default:
      return "";
  }
};

const roleColors = {
  admin: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  cashier: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  kitchen: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  customer: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

export default function Users() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { users, loading, updating, deleting } = useSelector((state) => state.users);
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    password: "",
    role: "kitchen",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await dispatch(registerUser(formData));
      toast.showToast({ message: t("admin.user_created"), type: "success" });
      dispatch(fetchUsers());
    } catch (err) {
      toast.showToast({ message: t("admin.user_create_fail"), type: "error" });
    } finally {
      setSubmitting(false);
    }

    setFormData({
      name: "",
      phoneNumber: "",
      email: "",
      password: "",
      role: "kitchen",
    });

    setShowForm(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await dispatch(updateUserRole({ userId, role: newRole })).unwrap();
      toast.showToast({ message: "Role updated successfully", type: "success" });
    } catch (err) {
      toast.showToast({ message: err || "Failed to update role", type: "error" });
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await dispatch(deleteUser(userId)).unwrap();
      toast.showToast({ message: "User deleted successfully", type: "success" });
    } catch (err) {
      toast.showToast({ message: err || "Failed to delete user", type: "error" });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {t("admin.users_title")}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {t("admin.users_desc")}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/25"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? t("admin.cancel") : t("admin.add_staff")}
        </button>
      </div>

      {/* Add Staff Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm animate-fadeIn">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("admin.add_new_staff")}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("name")}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter name"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("phone_number")}
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("email")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("password")}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("admin.role")}
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                >
                  <option value="kitchen">{t("admin.role_kitchen")}</option>
                  <option value="cashier">{t("admin.role_cashier")}</option>
                  <option value="admin">{t("admin.role_admin")}</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={submitting}>
                {t("admin.create_staff")}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t("loading")}</span>
          </div>
        </div>
      )}

      {/* Users List - Card View for Mobile, Table for Desktop */}
      {!loading && (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div
                key={user._id || user.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{user.phoneNumber}</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t("role")}:</span>
                    <div className="relative">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id || user.id, e.target.value)}
                        disabled={updating === (user._id || user.id)}
                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium cursor-pointer border-0 focus:ring-2 focus:ring-primary/20 ${roleColors[user.role] || roleColors.customer}`}
                      >
                        <option value="customer">{t("admin.role_customer")}</option>
                        <option value="kitchen">{t("admin.role_kitchen")}</option>
                        <option value="cashier">{t("admin.role_cashier")}</option>
                        <option value="admin">{t("admin.role_admin")}</option>
                      </select>
                      {updating === (user._id || user.id) ? (
                        <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                      ) : (
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(user._id || user.id, user.name)}
                    disabled={deleting === (user._id || user.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete user"
                  >
                    {deleting === (user._id || user.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("user")}
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("phone")}
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("email")}
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("role")}
                  </th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.map((user) => (
                  <tr
                    key={user._id || user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {user.phoneNumber}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`mailto:${user.email}`}
                        className="text-primary hover:underline"
                      >
                        {user.email}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative inline-block">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id || user.id, e.target.value)}
                          disabled={updating === (user._id || user.id)}
                          className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium cursor-pointer border-0 focus:ring-2 focus:ring-primary/20 ${roleColors[user.role] || roleColors.customer}`}
                        >
                          <option value="customer">{t("admin.role_customer")}</option>
                          <option value="kitchen">{t("admin.role_kitchen")}</option>
                          <option value="cashier">{t("admin.role_cashier")}</option>
                          <option value="admin">{t("admin.role_admin")}</option>
                        </select>
                        {updating === (user._id || user.id) ? (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                        ) : (
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(user._id || user.id, user.name)}
                        disabled={deleting === (user._id || user.id)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                        title="Delete user"
                      >
                        {deleting === (user._id || user.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {users.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {t("admin.no_staff")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t("admin.no_staff_desc")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
