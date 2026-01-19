// src/features/auth/OtpVerificationPage.jsx
import{ useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearError } from "../redux/slices/authSlice";
import { useNavigate, useLocation } from "react-router-dom";

export default function OtpVerificationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Get email from location.state
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/register");
    else localStorage.setItem("emailForOtp", email);
  }, [email, navigate]);

  // Local state for OTP input
  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      return; // simple validation
    }

  };

  const handleInputChange = (e) => {
    setOtp(e.target.value);
    if (error) dispatch(clearError());
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white shadow rounded">
        <h2 className="text-xl font-semibold mb-4">Enter OTP</h2>
        <p className="mb-4 text-sm text-gray-600">
          We sent a verification code to {email}
        </p>

        <form onSubmit={handleSubmit}>
          <label className="block mb-4">
            OTP
            <input
              type="text"
              value={otp}
              onChange={handleInputChange}
              className="w-full border px-3 py-2 rounded mt-1"
              placeholder="Enter OTP"
            />
          </label>

          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-primary text-white disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        {/* <div className="mt-4 text-sm text-gray-600">
          Didn't receive the code?{" "}
          <button
            className="text-primary underline"
            onClick={() => navigate("/register")}
          >
            Resend / Go back
          </button>
        </div> */}
      </div>
    </div>
  );
}
