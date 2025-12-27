import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { firebaseLogin, completeProfile } from "../redux/slices/authSlice";
import { Mail, ArrowLeft, ChefHat, Star, Users, Tag, Shield, ArrowRight, User } from "lucide-react";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../utils/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  // State management
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const isRtl = i18n.dir() === "rtl";

  // Initialize reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  };

  // Validate phone number (Egyptian format)
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(\+20|0)?1(0|1|2|5)\d{8}$/;
    if (!phone) return t("auth.validation.phoneNumber_required");
    if (!phoneRegex.test(phone)) return t("auth.validation.phoneNumber_invalid");
    return "";
  };

  const validateName = (name) => {
    if (!name || name.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  };

  const formatPhoneNumber = (phone) => {
    phone = phone.replace(/[\s-]/g, "");
    // If starts with 0, replace with +20
    if (phone.startsWith("0")) {
      return "+20" + phone.slice(1);
    }
    // If doesn't start with +, add +20
    if (!phone.startsWith("+")) {
      return "+20" + phone;
    }
    return phone;
  };

  const handlePhoneChange = (e) => {
    const { value } = e.target;
    setPhoneNumber(value);
    if (touched.phoneNumber) {
      const error = validatePhoneNumber(value);
      setErrors((prev) => ({ ...prev, phoneNumber: error }));
    }
  };

  const handlePhoneBlur = () => {
    setTouched((prev) => ({ ...prev, phoneNumber: true }));
    const error = validatePhoneNumber(phoneNumber);
    setErrors((prev) => ({ ...prev, phoneNumber: error }));
  };

  const handleNameChange = (e) => {
    const { value } = e.target;
    setName(value);
    if (touched.name) {
      const error = validateName(value);
      setErrors((prev) => ({ ...prev, name: error }));
    }
  };


  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    const error = validateName(name);
    setErrors((prev) => ({ ...prev, name: error }));
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // Only digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    const error = validatePhoneNumber(phoneNumber);
    if (error) {
      setErrors({ phoneNumber: error });
      setTouched({ phoneNumber: true });
      return;
    }

    setIsLoading(true);
    try {
      setupRecaptcha();
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const result = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      setShowOtpInput(true);
      setErrors({});
    } catch (err) {
      console.error("Error sending OTP:", err);
      setErrors({
        phoneNumber: err.message || "Failed to send OTP. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setErrors({ otp: "Please enter a valid 6-digit code" });
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP with Firebase
      const userCredential = await confirmationResult.confirm(otp);
      const firebaseUser = userCredential.user;

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();

      // Send token to backend
      const resultAction = await dispatch(firebaseLogin(idToken));

      if (firebaseLogin.fulfilled.match(resultAction)) {
        const user = resultAction.payload?.user || resultAction.payload;

        // Check if user has a name
        if (!user.name || user.name.trim() === "") {
          // New user - show name input
          // Cookies are already set from firebaseLogin, so completeProfile will work
          setShowNameInput(true);
          setShowOtpInput(false);
          setIsLoading(false);
          return;
        }
        redirectUser(user);
      } else {
        setErrors({
          otp: "Login failed. Please try again."
        });
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setErrors({
        otp: err.message || "Invalid verification code. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account",
      });

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const idToken = await firebaseUser.getIdToken();

      const resultAction = await dispatch(firebaseLogin(idToken));

      if (firebaseLogin.fulfilled.match(resultAction)) {
        const user = resultAction.payload?.user || resultAction.payload;

        if (!user.name) {
          setShowNameInput(true);
          return;
        }

        redirectUser(user);
      }
    } catch (err) {
      console.error("Google login error:", err);
      setErrors({ google: err.message || "Google sign-in failed" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletProfile = async (e) => {
    e.preventDefault();

    const error = validateName(name);
    if (error) {
      setErrors({ name: error });
      setTouched({ name: true });
      return;
    }

    setIsLoading(true);
    try {
      const resultAction = await dispatch(completeProfile({
        name: name.trim()
      }));

      if (completeProfile.fulfilled.match(resultAction)) {
        const user = resultAction.payload?.user || resultAction.payload;
        redirectUser(user);
      } else {
        setErrors({
          name: "Failed to complete profile. Please try again."
        });
      }
    } catch (err) {
      console.error("Error completing profile:", err);
      setErrors({
        name: err.message || "Failed to complete profile. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const redirectUser = (user) => {
    const role = (user?.role || "").toString().toLowerCase();
    if (role === "admin") {
      window.location.replace("/admin");
    } else if (role === "cashier") {
      window.location.replace("/cashier");
    } else if (role === "kitchen") {
      window.location.replace("/kitchen");
    } else {
      window.location.replace("/menu");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (!showOtpInput) {
        handleSendOtp(e);
      } else {
        handleVerifyOtp(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-7xl flex flex-col items-center lg:flex-row gap-12 lg:gap-16 ">
        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container" className="block"></div>

        {/* Mobile & Desktop: Login Form */}
        <div className=" w-full order-1 max-w-120">
          <div className="mb-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors group"
            >
              <ArrowLeft className={`w-5 h-5 ${isRtl ? "ml-2 group-hover:translate-x-1" : "mr-2 group-hover:-translate-x-1"} transition-transform`} />
              {t("auth.login.back_to_home") || "Back to Home"}
            </button>
          </div>

          {/* Login Form Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-primary via-primary/90 to-secondary text-center">
              <h2 className="text-3xl font-bold text-white mb-1">
                {showNameInput
                  ? "Complete Your Profile"
                  : t("auth.login.welcome_back") || "Welcome Back"}
              </h2>
              <p className="text-white/90 text-sm">
                {showNameInput
                  ? "Please enter your name to continue"
                  : showOtpInput
                    ? "Enter the code sent to your phone"
                    : t("auth.login.login_desc") || "Sign in to continue"}
              </p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">
                    {error}
                  </p>
                </div>
              )}

              {!showOtpInput && !showNameInput && (
                // Phone Number Input
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t("auth.login.phoneNumber_label")}
                    </label>
                    <div className="relative">
                      <Mail className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
                      <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        onKeyPress={handleKeyPress}
                        className={`w-full ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"} py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${errors.phoneNumber && touched.phoneNumber
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                          } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                        placeholder="01012345678"
                      />
                    </div>
                   
                    {errors.phoneNumber && touched.phoneNumber && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        {errors.phoneNumber}
                      </p>
                    )}
                  </div>
                    
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary/80 via-primary via-70% to-secondary hover:from-secondary/80 hover:via-primary hover:to-primary/80 text-white font-medium py-2.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                  </button>
                   <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full bg-green-600  py-2.5 rounded-lg flex items-center justify-center gap-3 hover:bg-green-700 transition"
                    >
                      Continue with Google
                    </button>
                </form>
              )}
              {showOtpInput && (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      id="otp"
                      value={otp}
                      onChange={handleOtpChange}
                      onKeyPress={handleKeyPress}
                      maxLength={6}
                      className={`w-full px-4 py-2.5 text-center text-2xl tracking-widest bg-gray-50 dark:bg-gray-700/50 border ${errors.otp ? "border-red-500" : "border-gray-200 dark:border-gray-600"
                        } rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      placeholder="000000"
                    />
                    {errors.otp && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        {errors.otp}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-gradient-to-r from-primary/80 via-primary via-70% to-secondary hover:from-secondary/80 hover:via-primary hover:to-primary/80 text-white font-medium py-2.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Verifying..." : "Verify & Login"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp("");
                      setErrors({});
                    }}
                    className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    Change phone number
                  </button>
                </form>
              )}

              {showNameInput && (
                <form onSubmit={handleCompletProfile} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={name}
                        onChange={handleNameChange}
                        onBlur={handleNameBlur}
                        onKeyPress={handleKeyPress}
                        className={`w-full ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"} py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${errors.name && touched.name
                            ? "border-red-500"
                            : "border-gray-200 dark:border-gray-600"
                          } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500`}
                        placeholder="Enter your name"
                      />
                    </div>
                    {errors.name && touched.name && (
                      <p className="mt-1 text-xs text-red-500 dark:text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-primary via-primary/90 to-secondary hover:from-secondary hover:to-primary text-white font-medium py-2.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Completing..." : "Complete Profile"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Desktop: Left Column (Branding & Stats) - Now smaller */}
        <div className="hidden lg:flex lg:w-2/5 flex-col justify-center">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-primary transition-colors mb-10 group"
          >
            <ArrowLeft className={`w-5 h-5 ${isRtl ? "ml-2 group-hover:translate-x-1" : "mr-2 group-hover:-translate-x-1"} transition-transform`} />
            Back to Home
          </button>

          <div className="bg-gradient-to-br from-primary/80 via-primary via-70% to-secondary rounded-3xl p-10 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 ${isRtl ? "left-0 translate-x-12" : "right-0 translate-x-12"} w-24 h-24 bg-white/10 rounded-full -translate-y-12`}></div>
            <div className={`absolute bottom-0 ${isRtl ? "right-0 -translate-x-16" : "left-0 -translate-x-16"} w-32 h-32 bg-white/5 rounded-full translate-y-16`}></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">{t("auth.login.brand_title")}</h1>
              </div>
              <p className="text-white/90 mb-10 text-base">
                {t("auth.login.brand_welcome")}
              </p>

              <div className="space-y-4">
                {/* Clickable Offer Card */}
                <div
                  onClick={() => navigate("/menu")}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer group hover:bg-white/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
                  tabIndex={0}
                  role="button"
                  onKeyPress={(e) => e.key === 'Enter' && navigate("/menu")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xl">{t("auth.login.offer_card.title")}</p>
                        <p className="text-white/80 text-sm">{t("auth.login.offer_card.subtitle")}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-white/60 group-hover:text-white ${isRtl ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"} transition-all`} />
                  </div>
                  <p className="text-white/70 text-xs mt-2">{t("auth.login.offer_card.desc")}</p>
                </div>

                {/* Clickable Reviews Card */}
                <div
                  onClick={() => navigate("/reviews")}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer group hover:bg-white/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
                  tabIndex={0}
                  role="button"
                  onKeyPress={(e) => e.key === 'Enter' && navigate("/reviews")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xl">{t("auth.login.reviews_card.title")}</p>
                        <p className="text-white/80 text-sm">{t("auth.login.reviews_card.subtitle")}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-white/60 group-hover:text-white ${isRtl ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"} transition-all`} />
                  </div>
                  <p className="text-white/70 text-xs mt-2">{t("auth.login.reviews_card.desc")}</p>
                </div>

                {/* Clickable Customers Card */}
                <div
                  onClick={() => navigate("/reward")}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 cursor-pointer group hover:bg-white/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-white/30"
                  tabIndex={0}
                  role="button"
                  onKeyPress={(e) => e.key === 'Enter' && navigate("/reward")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/30 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-xl">{t("auth.login.customers_card.title")}</p>
                        <p className="text-white/80 text-sm">{t("auth.login.customers_card.subtitle")}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-white/60 group-hover:text-white ${isRtl ? "group-hover:-translate-x-1 rotate-180" : "group-hover:translate-x-1"} transition-all`} />
                  </div>
                  <p className="text-white/70 text-xs mt-2">{t("auth.login.customers_card.desc")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-6 text-gray-600 dark:text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>{t("auth.login.secure_login")}</span>
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{t("auth.login.24_7_support")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}