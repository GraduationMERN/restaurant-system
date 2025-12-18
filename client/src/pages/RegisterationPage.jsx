import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../redux/slices/authSlice";
import { User, Mail, Lock, Phone, ArrowLeft, ChefHat, CheckCircle, Pizza, Utensils, Sparkles } from "lucide-react";

// Using Coffee as a burger alternative
import { Coffee as Hamburger } from "lucide-react";

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-+()]{10,}$/;

    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required";
        if (value.trim().length < 2)
          return "Name must be at least 2 characters";
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      phoneNumber: true,
    });

    try {
      const resultAction = await dispatch(registerUser(formData));
      if (registerUser.fulfilled.match(resultAction)) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate("/verifyOtp", { 
            state: { 
              email: formData.email,
              message: resultAction.payload.message || "Check your email for OTP"
            } 
          });
        }, 1500);
      }
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  // Floating food icons animation - use available icons
  const foodIcons = [
    { icon: Pizza, x: 10, y: 30, delay: 0 },
    { icon: Hamburger, x: 85, y: 20, delay: 200 },
    { icon: Utensils, x: 15, y: 70, delay: 400 },
    { icon: ChefHat, x: 80, y: 65, delay: 600 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch">
        
        {/* Mobile: Form FIRST */}
        <div className="lg:hidden w-full order-1">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          {/* Mobile Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary to-primary/80 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Join BrandBite</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Create your account
              </p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-shake">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.name && touched.name
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200`}
                      placeholder="Enter your name"
                    />
                  </div>
                  {errors.name && touched.name && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.email && touched.email
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.phoneNumber && touched.phoneNumber
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phoneNumber && touched.phoneNumber && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all duration-200`}
                      placeholder="Create password"
                    />
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium py-2.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : "Create Account"}
                </button>
              </form>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-orange-600 dark:text-orange-400"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Left Column (Smaller) - Animation Column */}
        <div className="hidden lg:flex lg:w-2/5 flex-col justify-center animate-slideInLeft">
          <button
            onClick={() => navigate("/")}
            className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>

          {/* Animated Illustration Container */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-float-gentle">
            {/* Floating Food Icons */}
            <div className="absolute inset-0 overflow-hidden">
              {foodIcons.map((food, index) => (
                <div
                  key={index}
                  className="absolute animate-float"
                  style={{
                    left: `${food.x}%`,
                    top: `${food.y}%`,
                    animationDelay: `${food.delay}ms`,
                    animationDuration: `${4 + index}s`,
                  }}
                >
                  <food.icon className="w-8 h-8 text-white/30 animate-pulse-slow" />
                </div>
              ))}
            </div>

            {/* Hungry Man Illustration */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Title */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">BrandBite</h1>
                  <p className="text-white/80 text-xs">The best restaurant experience</p>
                </div>
              </div>

              {/* Animated Hungry Man SVG - Simpler */}
              <div className="relative w-56 h-56 mb-6">
                {/* Hungry Man Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Head - Bouncing */}
                    <div className="animate-bounce-slow">
                      <div className="w-16 h-16 bg-amber-200 rounded-full relative mx-auto">
                        {/* Eyes */}
                        <div className="absolute top-4 left-4 w-3 h-3 bg-black rounded-full animate-blink"></div>
                        <div className="absolute top-4 right-4 w-3 h-3 bg-black rounded-full animate-blink" style={{animationDelay: '1s'}}></div>
                        {/* Smile */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-4 border-3 border-black border-t-0 rounded-b-full"></div>
                      </div>
                    </div>
                    
                    {/* Body with reaching hands */}
                    <div className="w-24 h-24 bg-gradient-to-b from-amber-300 to-amber-400 rounded-xl mx-auto -mt-2 relative">
                      {/* Reaching Hands */}
                      <div className="absolute -left-3 top-8 animate-reach-slow">
                        <div className="w-6 h-8 bg-amber-200 rounded-full"></div>
                      </div>
                      <div className="absolute -right-3 top-8 animate-reach-slow" style={{animationDelay: '0.5s'}}>
                        <div className="w-6 h-8 bg-amber-200 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Food Items */}
                <div className="absolute top-4 left-4 animate-float-delayed">
                  <Hamburger className="w-8 h-8 text-white/80" />
                </div>
                <div className="absolute top-12 right-4 animate-float-delayed" style={{animationDelay: '0.3s'}}>
                  <Pizza className="w-10 h-10 text-white/80" />
                </div>
              </div>

              {/* Clean Text */}
              <div className="text-center">
                <h2 className="text-lg font-bold text-white mb-2">
                  Join Our Food Family
                </h2>
                <p className="text-white/80 text-sm mb-4">
                  Register now for exclusive offers and the best dining experience
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <div className="text-white font-bold">500+</div>
                    <div className="text-white/70 text-xs">Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold">89</div>
                    <div className="text-white/70 text-xs">Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold">24/7</div>
                    <div className="text-white/70 text-xs">Service</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Right Column - Clean Form */}
        <div className="hidden lg:flex lg:w-3/5 items-center justify-center animate-slideInRight">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-lg">
            {/* Form Header */}
            <div className="p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Create Account
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Join BrandBite for an exceptional dining experience
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-shake">
                  <p className="text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
                </div>
              )}

              {showSuccess && (
                <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <p className="text-green-600 dark:text-green-400 text-center font-medium">
                    Account created successfully!
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-12 pr-4 py-3.5 bg-transparent border ${
                        errors.name && touched.name
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:border-orange-500"
                      } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:focus:ring-orange-500/20 transition-all duration-200`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && touched.name && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-12 pr-4 py-3.5 bg-transparent border ${
                        errors.email && touched.email
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:border-orange-500"
                      } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:focus:ring-orange-500/20 transition-all duration-200`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label
                    htmlFor="phoneNumber"
                    className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="tel"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-12 pr-4 py-3.5 bg-transparent border ${
                        errors.phoneNumber && touched.phoneNumber
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:border-orange-500"
                      } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:focus:ring-orange-500/20 transition-all duration-200`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phoneNumber && touched.phoneNumber && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.phoneNumber}</p>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </label>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Must be 8+ characters
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-12 pr-4 py-3.5 bg-transparent border ${
                        errors.password && touched.password
                          ? "border-red-500 focus:border-red-500"
                          : "border-gray-300 dark:border-gray-600 focus:border-orange-500"
                      } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:focus:ring-orange-500/20 transition-all duration-200`}
                      placeholder="Create a strong password"
                    />
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Account...
                    </span>
                  ) : "Create Account"}
                </button>
              </form>

              {/* Sign In Link */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: Left Column (Comes after form) */}
        <div className="lg:hidden w-full order-2 mt-6">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">BrandBite</h2>
                <p className="text-white/80 text-xs">Join the food revolution</p>
              </div>
            </div>
            
            {/* Simple Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-white font-bold text-lg">500+</div>
                <div className="text-white/70 text-xs">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-lg">89</div>
                <div className="text-white/70 text-xs">Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-white font-bold text-lg">24/7</div>
                <div className="text-white/70 text-xs">Service</div>
              </div>
            </div>
            
            {/* Quick Animated Element */}
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                <ChefHat className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}