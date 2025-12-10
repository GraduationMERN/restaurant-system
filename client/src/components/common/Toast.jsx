import React from "react";
import { X } from "lucide-react";

export default function Toast({ message, type = "error", onClose }) {
  return (
    <div
      className={`
        fixed top-5 right-5 z-[9999]
        rounded-xl shadow-lg px-4 py-3 
        flex items-center gap-3 animate-slideIn
        ${type === "error" ? "bg-red-500 text-white" : "bg-green-500 text-white"}
      `}
    >
      <span className="font-medium">{message}</span>
      <button onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
}
