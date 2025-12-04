import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function NotFound404() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center sm:p-6 bg-gray-50">
      {/* Animated Image */}
      <motion.img
        src="/test2.png"
        alt="404 illustration"
        className="w-full max-w-lg sm:max-w-xl mb-6 select-none"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="text-center px-2 sm:px-0"
      >
        <h1 className="text-4xl sm:text-6xl font-extrabold text-[#e96a4a]">
          Ooops! 404
        </h1>

        <p className="text-gray-700 text-base sm:text-lg mt-2">
          Looks like this page wasn’t on the menu today.
          <br />
          Let's get you back on track.
        </p>

        {/* Button */}
        <motion.button
          onClick={() => navigate("/menu")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="
      mt-6 px-6 py-3 rounded-xl 
      bg-[#e96a4a] text-white 
      shadow-md hover:shadow-lg 
      transition-all font-semibold
    "
        >
          Back to Menu
        </motion.button>
      </motion.div>

      {/* Gentle floating animation */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: [-5, 5, -5] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="mt-6 sm:mt-12 text-center w-full text-sm text-gray-500 px-2"
      >
        🥄 Don’t worry, the menu is still safe!
      </motion.div>
    </div>
  );
}
