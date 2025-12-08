// import { useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Link, useNavigate } from "react-router-dom";
// import { registerUser } from "../redux/slices/authSlice";

// export default function RegistrationForm() {
//   const [formData, setFormData] = useState({
//     name: "",
//     email: "",
//     password: "",
//     phoneNumber: "",
//   });
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { loading, error } = useSelector((state) => state.auth);

//   const [errors, setErrors] = useState({});
//   const [touched, setTouched] = useState({});

//   const validateField = (name, value) => {
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const phoneRegex = /^[\d\s\-+()]{10,}$/;

//     switch (name) {
//       case "name":
//         if (!value.trim()) return "Name is required";
//         if (value.trim().length < 2)
//           return "Name must be at least 2 characters";
//         return "";

//       case "email":
//         if (!value) return "Email is required";
//         if (!emailRegex.test(value)) return "Please enter a valid email";
//         return "";

//       case "password":
//         if (!value) return "Password is required";
//         if (value.length < 8) return "Password must be at least 8 characters";
//         if (!/(?=.*[a-z])/.test(value))
//           return "Password must contain a lowercase letter";
//         if (!/(?=.*[A-Z])/.test(value))
//           return "Password must contain an uppercase letter";
//         if (!/(?=.*\d)/.test(value)) return "Password must contain a number";
//         return "";

//       case "phoneNumber":
//         if (!value) return "Phone number is required";
//         if (!phoneRegex.test(value)) return "Please enter a valid phone number";
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
//     setTouched({
//       name: true,
//       email: true,
//       password: true,
//       phoneNumber: true,
//     });

//     try {
//       const resultAction = await dispatch(registerUser(formData));
//       if (registerUser.fulfilled.match(resultAction)) {
//         // Registration successful
//         navigate("/verifyOtp", { state: { email: formData.email } });
//       }
//     } catch (err) {
//       console.error("Registration error:", err);
//     }

//     // if (Object.keys(newErrors).length === 0) {
//     //   setLoading(true);
//     //   setApiError("");

//     //   try {
//     //     // Replace with your actual API endpoint
//     //     const response = await api.post("auth/register", {
//     //       body: JSON.stringify({
//     //         name: formData.name,
//     //         email: formData.email,
//     //         password: formData.password,
//     //         phoneNumber: formData.phoneNumber,
//     //       }),
//     //     });

//     //     const data = await response.json();

//     //     if (!response.ok) {
//     //       throw new Error(data.message || "Registration failed");
//     //     }

//     //     // Success
//     //     setSubmitted(true);
//     //     setTimeout(() => {
//     //       setSubmitted(false);
//     //       setFormData({ name: "", email: "", password: "", phoneNumber: "" });
//     //       setTouched({});
//     //     }, 3000);
//     //   } catch (error) {
//     //     setApiError(error.message || "Something went wrong. Please try again.");
//     //   } finally {
//     //     setLoading(false);
//     //   }
//     // }
//   };

//   const handleKeyPress = (e) => {
//     if (e.key === "Enter") {
//       handleSubmit(e);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-white flex items-center justify-center p-4">
//       <div className="w-full max-w-md">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
//           <div className="text-center mb-8">
//             <h1 className="text-3xl font-bold text-primary mb-2">
//               Create Account
//             </h1>
//             <p className="text-primary">Join us today and get started</p>
//           </div>

//           {error && (
//             <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
//               <p className="text-red-700 text-center font-medium">{error}</p>
//             </div>
//           )}

//           <div className="space-y-5">
//             <div>
//               <label
//                 htmlFor="name"
//                 className="primary block text-sm font-semibold mb-2 text-primary"
//               >
//                 Full Name
//               </label>
//               <input
//                 type="text"
//                 id="name"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 onKeyPress={handleKeyPress}
//                 className={`w-full px-4 py-3 bg-gray-50 border ${
//                   errors.name && touched.name
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 } rounded-lg text-gray-900 placeholder-gray-500 focus-primary focus:outline-none transition-all`}
//                 placeholder="flap jack"
//               />
//               {errors.name && touched.name && (
//                 <p className="mt-1 text-sm text-red-400">{errors.name}</p>
//               )}
//             </div>

//             <div>
//               <label
//                 htmlFor="email"
//                 className="primary block text-sm font-semibold mb-2 text-primary"
//               >
//                 Email Address
//               </label>
//               <input
//                 type="email"
//                 id="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 onKeyPress={handleKeyPress}
//                 className={`w-full px-4 py-3 bg-gray-50 border ${
//                   errors.email && touched.email
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 } rounded-lg text-gray-900 placeholder-gray-500 focus-primary focus:outline-none transition-all`}
//                 placeholder="john@example.com"
//               />
//               {errors.email && touched.email && (
//                 <p className="mt-1 text-sm text-red-400">{errors.email}</p>
//               )}
//             </div>

//             <div>
//               <label
//                 htmlFor="password"
//                 className="primary block text-sm font-semibold mb-2 text-primary"
//               >
//                 Password
//               </label>
//               <input
//                 type="password"
//                 id="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 onKeyPress={handleKeyPress}
//                 className={`w-full px-4 py-3 bg-gray-50 border ${
//                   errors.password && touched.password
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 } rounded-lg text-gray-900 placeholder-gray-500 focus-primary focus:outline-none transition-all`}
//                 placeholder="••••••••"
//               />
//               {errors.password && touched.password && (
//                 <p className="mt-1 text-sm text-red-400">{errors.password}</p>
//               )}
//             </div>

//             <div>
//               <label
//                 htmlFor="phoneNumber"
//                 className="primary block text-sm font-semibold mb-2 text-primary"
//               >
//                 Phone Number
//               </label>
//               <input
//                 type="tel"
//                 id="phoneNumber"
//                 name="phoneNumber"
//                 value={formData.phoneNumber}
//                 onChange={handleChange}
//                 onBlur={handleBlur}
//                 onKeyPress={handleKeyPress}
//                 className={`w-full px-4 py-3 bg-gray-50 border ${
//                   errors.phoneNumber && touched.phoneNumber
//                     ? "border-red-500"
//                     : "border-gray-300"
//                 } rounded-lg text-gray-900 placeholder-gray-500 focus-primary focus:outline-none transition-all`}
//                 placeholder="0123 456 789"
//               />
//               {errors.phoneNumber && touched.phoneNumber && (
//                 <p className="mt-1 text-sm text-red-400">
//                   {errors.phoneNumber}
//                 </p>
//               )}
//             </div>

//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="w-full bg-primary text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
//             >
//               {loading ? (
//                 <span className="flex items-center justify-center">
//                   <svg
//                     className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Creating Account...
//                 </span>
//               ) : (
//                 "Create Account"
//               )}
//             </button>
//           </div>

//           <div className="mt-6 text-center">
//             <p className="text-gray-600 text-sm">
//               Already have an account?{" "}
//               <Link
//                 to="/login"
//                 className="primary font-semibold hover:underline"
//               >
//                 Sign in
//               </Link>
//             </p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../redux/slices/authSlice";
import { User, Mail, Lock, Phone, ArrowLeft, ChefHat, CheckCircle } from "lucide-react";

export default function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
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
        navigate("/verifyOtp", { state: { email: formData.email } });
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-primary/50 dark:hover:text-primary/40 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Registration Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-primary from-primary/50 to-primary/60 p-6 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Join Bella Vista</h1>
            <p className="text-orange-100 opacity-90 mt-1">
              Create your account to get started
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-center font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.name && touched.name
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                    } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    placeholder="flap jack"
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
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.email && touched.email
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                    } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    placeholder="john@example.com"
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
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.phoneNumber && touched.phoneNumber
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                    } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    placeholder="0123 456 789"
                  />
                </div>
                {errors.phoneNumber && touched.phoneNumber && (
                  <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.phoneNumber}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border ${
                      errors.password && touched.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                    } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 transition-all`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && touched.password && (
                  <p className="mt-2 text-sm text-red-500 dark:text-red-400">{errors.password}</p>
                )}
                
                {/* Password Requirements */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center text-xs">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      formData.password.length >= 8 ? "text-green-500" : "text-gray-400"
                    }`} />
                    <span className={`${formData.password.length >= 8 ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                      At least 8 characters
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      /(?=.*[a-z])/.test(formData.password) ? "text-green-500" : "text-gray-400"
                    }`} />
                    <span className={`${/(?=.*[a-z])/.test(formData.password) ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                      One lowercase letter
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      /(?=.*[A-Z])/.test(formData.password) ? "text-green-500" : "text-gray-400"
                    }`} />
                    <span className={`${/(?=.*[A-Z])/.test(formData.password) ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                      One uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center text-xs">
                    <CheckCircle className={`w-4 h-4 mr-2 ${
                      /(?=.*\d)/.test(formData.password) ? "text-green-500" : "text-gray-400"
                    }`} />
                    <span className={`${/(?=.*\d)/.test(formData.password) ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}`}>
                      One number
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary from-primary/50 to-primary/60 hover:from-primary/60 hover:to-primary/70 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : "Create Account"}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary dark:text-primary/40 hover:text-primary/60 dark:hover:text-primary/30 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}