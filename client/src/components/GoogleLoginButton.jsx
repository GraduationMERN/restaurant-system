import React from "react";

export default function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="w-full mt-4 flex items-center justify-center gap-3 px-4 py-3 bg-green-500 text-white font-semibold rounded-lg transition-all transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 48 48"
      >
        <path
          fill="#fff"
          d="M44.5 20H24v8.5h11.9C34.6 33.3 30 37 24 37c-7.7 0-14-6.3-14-14s6.3-14 14-14c3.7 0 7 1.4 9.5 3.5l6.6-6.6C36.4 4.7 30.5 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 22-20 0-1.3-.1-2.6-.5-4z"
        />
      </svg>
      Sign in with Google
    </button>
  );
}
