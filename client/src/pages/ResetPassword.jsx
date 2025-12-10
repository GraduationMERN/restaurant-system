import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword, clearAuthState } from "../redux/slices/authSlice";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, message, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(resetPassword({ token, password }));
  };

  useEffect(() => {
    if (message === "Password reset successful") {
      setTimeout(() => navigate("/login"), 1500);
    }
  }, [message, navigate]);

  useEffect(() => {
    return () => dispatch(clearAuthState());
  }, [dispatch]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 shadow-lg">
      <h2 className="text-2xl mb-4">Reset Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          className="border p-2 rounded w-full mb-4"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {message && <p className="text-green-600 mt-4">{message}</p>}
    </div>
  );
}
