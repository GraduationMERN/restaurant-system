import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../../redux/slices/usersSlice";
import { registerUser } from "../../redux/slices/authSlice";
import Button from "../../components/ui/button/Button";
import { useToast } from "../../hooks/useToast";

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

export default function Users() {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);
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

    // live validation
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submit
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    // If any errors exist, stop submission
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await dispatch(registerUser(formData));
      toast.showToast({ message: "User created", type: "success" });
    } catch (err) {
      toast.showToast({ message: "Failed to create user", type: "error" });
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

  return (
    <div className="min-h-screen text-white p-10 space-y-10">
      <h1 className="text-4xl font-semibold text-primary">Staff Management</h1>

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-primary px-6 py-2 rounded-xl shadow-lg text-lg hover:opacity-90 transition"
      >
        Add Staff
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl shadow-xl bg-secondary space-y-5 max-w-lg animate-fadeIn"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block mb-1 text-primary">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus-primary"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block mb-1 text-primary">Phone Number</label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Phone Number"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus-primary"
              />
              {errors.phoneNumber && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1 text-primary">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus-primary"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1 text-primary">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus-primary"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block mb-1 text-primary">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus-primary"
              >
                <option value="kitchen" className="text-gray-900">
                  Kitchen
                </option>
                <option value="cashier" className="text-gray-900">
                  Cashier
                </option>
              </select>
            </div>
          </div>

          <Button type="submit" loading={submitting} className="w-full">Submit</Button>
        </form>
      )}

      {loading && <p className="text-primary text-lg mt-5">Loading users...</p>}

      {!loading && (
        <table className="w-full text-left mt-5 bg-gray-800 rounded-xl overflow-hidden">
          <thead className="bg-primary text-gray-900">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.phoneNumber}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
