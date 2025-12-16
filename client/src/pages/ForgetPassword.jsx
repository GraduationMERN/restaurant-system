import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendResetEmail, clearAuthState } from "../redux/slices/authSlice";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();

  const { loading, message, error } = useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(sendResetEmail(email));
  };

  useEffect(() => {
    return () => dispatch(clearAuthState());
  }, [dispatch]);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 shadow-lg rounded-lg">
      <h2 className="text-2xl mb-4">Forgot Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          className="border p-2 rounded w-full mb-4"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      {error && <p className="text-red-600 mt-4">{error}</p>}
      {message && <p className="text-green-600 mt-4">{message}</p>}
    </div>
  );
}
