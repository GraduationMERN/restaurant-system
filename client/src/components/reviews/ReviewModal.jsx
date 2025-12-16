import React, { useState } from "react";
import { Star, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { createReview, fetchReviews } from "../../redux/slices/reviewSlice";
import { useTranslation } from "react-i18next";
import { useToast } from "../../hooks/useToast";

export default function ReviewModal({ isOpen, close }) {
  const dispatch = useDispatch();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const { t } = useTranslation();
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleImageChange = (e) => setImages([...e.target.files]);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast("Please provide a rating", "error");
      return;
    }

    const formData = new FormData();
    formData.append("rating", rating);
    formData.append("comment", comment || "");
    // server expects `anonymous` field name
    formData.append("anonymous", isAnonymous ? "true" : "false");

    images.forEach((img) => formData.append("photos", img));

    try {
      await dispatch(createReview(formData)).unwrap();
      await dispatch(fetchReviews());
      close();
    } catch (err) {
      showToast("Failed to submit review.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-11/12 max-w-md rounded-2xl shadow-lg p-6 relative">
        <button className="absolute top-4 right-4 text-muted" onClick={close}>
          <X size={20} />
        </button>
        <h3 className="text-xl font-semibold mb-4">{t("write_review")}</h3>

        <p className="text-sm mb-2 font-medium">{t("rating")}</p>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <Star
              key={num}
              size={26}
              onClick={() => setRating(num)}
              className={
                num <= rating
                  ? "text-yellow-400 fill-yellow-400 cursor-pointer"
                  : "text-gray-300 cursor-pointer"
              }
            />
          ))}
        </div>

        <p className="text-sm mb-2 font-medium">{t("comment")}</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("share_experience")}
          className="w-full h-28 border border-gray-300 rounded-xl p-3 text-sm"
        />

        <p className=" text-sm mb-2 mt-2 font-medium">{t("upload_photos")}</p>
        <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-xl inline-flex items-center gap-2">
          {t("choose_your_photos")}
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <div className="flex gap-2 mt-2 overflow-x-auto">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={URL.createObjectURL(img)}
              alt={`preview-${idx}`}
              className="h-20 w-20 object-cover rounded-lg"
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <input
            type="checkbox"
            id="anon"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <label htmlFor="anon" className="text-sm">
            {t("post_anonymously")}
          </label>
        </div>

        <button
          className="w-full mt-4 bg-primary text-white py-2 rounded-xl shadow"
          onClick={handleSubmit}
        >
          {t("submit")}
        </button>
      </div>
    </div>
  );
}
