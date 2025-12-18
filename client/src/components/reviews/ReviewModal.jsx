  import React, { useState } from "react";
import { Star, X, Upload, Image, User, Send, Shield } from "lucide-react";
import { useDispatch } from "react-redux";
import { createReview, fetchReviews } from "../../redux/slices/reviewSlice";
import { useTranslation } from "react-i18next";
import { useToast } from "../../hooks/useToast";

export default function ReviewModal({ isOpen, close }) {
  const dispatch = useDispatch();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const { t } = useTranslation();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 4) {
      showToast("Maximum 4 images allowed", "warning");
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast("Please provide a rating", "error");
      return;
    }

    const formData = new FormData();
    formData.append("rating", rating);
    formData.append("comment", comment || "");
    formData.append("anonymous", isAnonymous ? "true" : "false");

    images.forEach((img) => formData.append("photos", img));

    try {
      await dispatch(createReview(formData)).unwrap();
      await dispatch(fetchReviews());
      close();
      resetForm();
    } catch (err) {
      showToast("Failed to submit review.", "error");
    }
  };

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setComment("");
    setImages([]);
    setIsAnonymous(false);
  };

  const handleClose = () => {
    resetForm();
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl animate-scaleIn">
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors hover:scale-110"
        >
          <X size={20} className="text-gray-700 dark:text-gray-300" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("write_review")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Share your dining experience
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Rating Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              How would you rate your experience?
            </label>
            <div className="flex gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  onMouseEnter={() => setHoverRating(num)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform duration-200 hover:scale-125"
                >
                  <Star
                    size={32}
                    className={
                      num <= (hoverRating || rating)
                        ? "text-amber-500 fill-amber-500"
                        : "text-gray-300 dark:text-gray-600"
                    }
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}
            </p>
          </div>

          {/* Comment Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {t("comment")}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("share_experience") || "Tell us about your experience..."}
              className="w-full h-32 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-all duration-200"
              rows="4"
            />
          </div>

          {/* Photo Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Image size={18} />
                {t("upload_photos")}
              </label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {images.length}/4 images
              </span>
            </div>
            
            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`preview-${idx}`}
                      className="h-20 w-full object-cover rounded-lg shadow-sm"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Button */}
            <label className="w-full cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 hover:border-amber-500 dark:hover:border-amber-500 transition-colors duration-200 bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <Upload className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("choose_your_photos") || "Upload photos"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    JPEG, PNG up to 5MB each
                  </p>
                </div>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                <User size={16} className="text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("post_anonymously")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your name won't be shown publicly
                </p>
              </div>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                id="anon"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="sr-only"
              />
              <label
                htmlFor="anon"
                className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  isAnonymous 
                    ? "bg-amber-500" 
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                    isAnonymous ? "translate-x-6" : ""
                  }`}
                />
              </label>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Shield size={14} className="flex-shrink-0 mt-0.5" />
            <p>Your review will be publicly visible. By submitting, you agree to our review guidelines.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className={`flex-1 flex items-center justify-center gap-2 font-medium py-3 px-6 rounded-xl transition-all duration-300 ${
                rating === 0
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 hover:shadow-lg hover:scale-[1.02]"
              }`}
            >
              <Send size={18} />
              {t("submit")}
            </button>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}