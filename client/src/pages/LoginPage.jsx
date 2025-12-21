// import { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Link, useNavigate } from "react-router-dom";
// import { loginUser, getMe } from "../redux/slices/authSlice";
// import GoogleLoginButton from "../components/GoogleLoginButton";
// import { Mail, Lock, ArrowLeft, ChefHat } from "lucide-react";

// export default function LoginPage() {
//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
//   });

//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error } = useSelector((state) => state.auth);

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});

//   const validateField = (name, value) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

//     switch (name) {
//       case "email":
//         if (!value) return "Email is required";
//         if (!emailRegex.test(value)) return "Please enter a valid email";
//         return "";
//       case "password":
//         if (!value) return "Password is required";
//         if (value.length < 8) return "Password must be at least 8 characters";
//         return "";
//       default:
//         return "";
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));

//     if (touched[name]) {
//       const error = validateField(name, value);
//       setErrors((prev) => ({ ...prev, [name]: error }));
//     }
//   };

//   const handleBlur = (e) => {
//     const { name, value } = e.target;
//     setTouched((prev) => ({ ...prev, [name]: true }));
//     const error = validateField(name, value);
//     setErrors((prev) => ({ ...prev, [name]: error }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const newErrors = {};
//     Object.keys(formData).forEach((key) => {
//       const error = validateField(key, formData[key]);
//       if (error) newErrors[key] = error;
//     });

//     setErrors(newErrors);
//     setTouched({ email: true, password: true });

//     if (Object.keys(newErrors).length === 0) {
//       const resultAction = await dispatch(loginUser(formData));
//       if (loginUser.fulfilled.match(resultAction)) {
//         // Fetch full user profile (includes role)
//         const meAction = await dispatch(getMe());
//         const user = meAction.payload || resultAction.payload?.user || null;

//         // Redirect based on role
//         const role = (user?.role || "").toString().toLowerCase();
//         if (role === "admin") {
//           // Force full reload to ensure admin layout mounts and server cookies are sent
//           window.location.replace("/admin");
//           return;
//         }
//         if (role === "cashier") {
//           window.location.replace("/cashier");
//           return;
//         }
//         if (role === "kitchen") {
//           window.location.replace("/kitchen");
//           return;
//         }

//         // Default: customer -> menu
//         window.location.replace("/menu");
//       }
//     }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") {
//       handleSubmit(e);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         {/* Back Button */}
//         <button
//           onClick={() => navigate("/")}
//           className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-orange-400 transition-colors mb-6 group"
//         >
//           <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
//           Back to Home
//         </button>

//         {/* Login Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
//           {/* Header */}
//           <div className="bg-primary from-primary/50 to-primary/60 p-6 text-center">
//             <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
//               <ChefHat className="w-10 h-10 text-white" />
//             </div>
//             <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
//             <p className="text-orange-100 opacity-90 mt-1">
//               Please login to continue
//             </p>
//           </div>

//           {/* Form Content */}
//           <div className="p-8">
//             {error && (
//               <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
//                 <p className="text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
//               </div>
//             )}

//             <form onSubmit={handleSubmit} className="space-y-6">
//               {/* Email Field */}
//               <div>
//                 <label
//                   htmlFor="email"
//                   className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
//                 >
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
//                   <input
//                     type="email"
//                     id="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     onKeyPress={handleKeyPress}
//                     className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border ${errors.email && touched.email
//                       ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                       : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
//                       } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
//                     placeholder="john@example.com"
//                   />
//                 </div>
//                 {errors.email && touched.email && (
//                   <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.email}</p>
//                 )}
//               </div>

//               {/* Password Field */}
//               <div>
//                 <div className="flex justify-between items-center mb-2">
//                   <label
//                     htmlFor="password"
//                     className="block text-sm font-medium text-gray-700 dark:text-gray-300"
//                   >
//                     Password
//                   </label>
//                   <Link
//                     to="/forgot-password"
//                     className="text-sm text-primary dark:text-primary/40 hover:text-primary/60 dark:hover:text-primary/30 transition-colors"
//                   >
//                     Forgot password?
//                   </Link>
//                 </div>
//                 <div className="relative">
//                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
//                   <input
//                     type="password"
//                     id="password"
//                     name="password"
//                     value={formData.password}
//                     onChange={handleChange}
//                     onBlur={handleBlur}
//                     onKeyPress={handleKeyPress}
//                     className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border ${errors.password && touched.password
//                       ? "border-red-500 focus:border-red-500 focus:ring-red-500"
//                       : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
//                       } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
//                     placeholder="••••••••"
//                   />
//                 </div>
//                 {errors.password && touched.password && (
//                   <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.password}</p>
//                 )}
//               </div>

//               {/* Submit Button */}
//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full bg-primary from-primary/50 to-primary/60 hover:from-primary/60 hover:to-primary/70 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
//               >
//                 {loading ? (
//                   <span className="flex items-center justify-center">
//                     <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                     </svg>
//                     Logging in...
//                   </span>
//                 ) : "Login"}
//               </button>
//             </form>

//             {/* Sign Up Link */}
//             <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
//               <p className="text-gray-600 dark:text-gray-400 text-sm">
//                 Don't have an account?{" "}
//                 <Link
//                   to="/register"
//                   className="font-semibold text-primary dark:text-primary/40 hover:text-primary/60 dark:hover:text-primary/20 transition-colors"
//                 >
//                   Sign up now
//                 </Link>
//               </p>
//             </div>
//           </div>
//           <div className="mt-6 text-center">
//             <p className="text-gray-600 text-sm">
//               Forgot password?{" "}
//               <Link
//                 to="/forgot-password"
//                 className="primary font-semibold hover:underline"
//               >
//                 Reset Password
//               </Link>
//             </p>
//           </div>
//           <GoogleLoginButton />
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { loginUser, getMe } from "../redux/slices/authSlice";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { Mail, Lock, ArrowLeft, ChefHat, Star, Users, Tag, Shield, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    switch (name) {
      case "email":
        if (!value) return t("auth.validation.email_required");
        if (!emailRegex.test(value)) return t("auth.validation.email_invalid");
        return "";
      case "password":
        if (!value) return t("auth.validation.password_required");
        if (value.length < 8) return t("auth.validation.password_min");
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
    setTouched({ email: true, password: true });

    if (Object.keys(newErrors).length === 0) {
      const resultAction = await dispatch(loginUser(formData));
      if (loginUser.fulfilled.match(resultAction)) {
        // Fetch full user profile (includes role)
        const meAction = await dispatch(getMe());
        const user = meAction.payload || resultAction.payload?.user || null;

        // Redirect based on role
        const role = (user?.role || "").toString().toLowerCase();
        if (role === "admin") {
          // Force full reload to ensure admin layout mounts and server cookies are sent
          window.location.replace("/admin");
          return;
        }
        if (role === "cashier") {
          window.location.replace("/cashier");
          return;
        }
        if (role === "kitchen") {
          window.location.replace("/kitchen");
          return;
        }

        // Default: customer -> menu
        window.location.replace("/menu");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const isRtl = i18n.dir() === "rtl";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-12 lg:gap-16 items-stretch">
        {/* Mobile: Login Form First */}
        <div className="lg:hidden w-full order-1">
          <div className="mb-6">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
            >
              <ArrowLeft className={`w-5 h-5 ${isRtl ? "ml-2 group-hover:translate-x-1" : "mr-2 group-hover:-translate-x-1"} transition-transform`} />
              Back to Home
            </button>
          </div>
          
          {/* Mobile Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-primary/70 to-primary text-center">
              <h2 className="text-3xl font-bold text-white mb-1">{t("auth.login.welcome_back")}</h2>
              <p className="text-gray-200 dark:text-gray-400 text-sm">
                {t("auth.login.login_desc")}
              </p>
            </div>
            
            <div className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-shake">
                  <p className="text-red-600 dark:text-red-400 text-sm text-center font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("auth.login.email_label")}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"} py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.email && touched.email
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary`}
                      placeholder={t("auth.login.email_placeholder")}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t("auth.login.password_label")}
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-primary/80 hover:text-primary"
                    >
                      {t("auth.login.forgot_password")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500`} />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full ${isRtl ? "pr-10 pl-3" : "pl-10 pr-3"} py-2.5 text-sm bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-gray-200 dark:border-gray-600"
                      } rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-orange-500`}
                      placeholder={t("auth.login.password_placeholder")}
                    />
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary/80 via-primary via-70% to-secondary hover:from-secondary/80 hover:via-primary hover:to-primary/80 text-white font-medium py-2.5 text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className={`animate-spin ${isRtl ? "-mr-1 ml-2" : "-ml-1 mr-2"} h-4 w-4 text-white`} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("auth.login.logging_in")}
                    </span>
                  ) : t("auth.login.submit")}
                </button>
              </form>

              <div className="mt-6">
                <GoogleLoginButton />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  {t("auth.login.no_account")}{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-orange-600 dark:text-orange-400"
                  >
                    {t("auth.login.sign_up_now")}
                  </Link>
                </p>
              </div>
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

        {/* Desktop: Right Column (Login Form) */}
        <div className="hidden lg:flex lg:w-3/5 items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden w-full max-w-xl">
            <div className="p-10 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t("auth.login.welcome_back")}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t("auth.login.login_desc")}
              </p>
            </div>

            <div className="p-10">
              {error && (
                <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-shake">
                  <p className="text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-3"
                  >
                    {t("auth.login.email_label")}
                  </label>
                  <div className="relative">
                    <Mail className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 dark:text-gray-500`} />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full ${isRtl ? "pr-14 pl-4" : "pl-14 pr-4"} py-4 bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.email && touched.email
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-500/20"
                      } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-200 text-base`}
                      placeholder={t("auth.login.email_placeholder")}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label
                      htmlFor="password"
                      className="block text-lg font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t("auth.login.password_label")}
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-primary/80 hover:text-primary transition-colors text-base"
                    >
                      {t("auth.login.forgot_password")}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 dark:text-gray-500`} />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onKeyPress={handleKeyPress}
                      className={`w-full ${isRtl ? "pr-14 pl-4" : "pl-14 pr-4"} py-4 bg-gray-50 dark:bg-gray-700/50 border ${
                        errors.password && touched.password
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                          : "border-gray-200 dark:border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-500/20"
                      } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-200 text-base`}
                      placeholder={t("auth.login.password_placeholder")}
                    />
                  </div>
                  {errors.password && touched.password && (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.password}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary/80 via-primary via-70% to-secondary hover:from-secondary/80 hover:via-primary hover:to-primary/80 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl text-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className={`animate-spin ${isRtl ? "-mr-1 ml-3" : "-ml-1 mr-3"} h-6 w-6 text-white`} fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("auth.login.logging_in")}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <ChefHat className="w-6 h-6" />
                      {t("auth.login.sign_in_title")}
                    </span>
                  )}
                </button>
              </form>

              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t("auth.login.or_continue")}
                  </span>
                </div>
              </div>

              <GoogleLoginButton />

              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  {t("auth.login.no_account")}{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-primary/80 hover:text-primary transition-colors text-lg"
                  >
                    {t("auth.login.join_message")}
                  </Link>
                </p>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("auth.login.need_help")}{" "}
                  <Link
                    to="/support"
                    className="text-primary/80 font-medium hover:text-primary transition-colors hover:underline"
                  >
                    {t("auth.login.contact_support")}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}