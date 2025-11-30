import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ReviewsGrid({ reviews }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const { t } = useTranslation();

  if (!reviews || reviews.length === 0) return <p>{t("no_reviews")}</p>;

  const getInitials = (name) => {
    if (!name) return t("anonymous").slice(0, 2).toUpperCase();

    const parts = name.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-3">
      {reviews.map((review) => {
        if (review.status === "pending") return null;

        const userName = review.user?.name || t("anonymous");
        const initials = getInitials(review.user?.name);

        return (
          <div
            style={{ backgroundColor: "var(--surface)" }}
            key={review._id}
            className="border p-4 rounded-lg shadow-sm"
          >
            {/* User info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold">
                {initials}
              </div>
              <span className="font-medium">{userName}</span>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={i < review.rating ? "text-yellow-400" : "text-gray-300"}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Comment */}
            <p className="mt-1">{review.comment || t("no_comment")}</p>

            {/* Photos */}
            <div className="flex gap-2 mt-2">
              {review.photos?.map((photo) => (
                <img
                  key={photo.public_id || photo.url}
                  src={photo.url}
                  alt="review"
                  className="h-16 w-16 object-cover rounded cursor-pointer"
                  onClick={() => setSelectedPhoto(photo.url)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 cursor-pointer"
          onClick={() => setSelectedPhoto(null)}
        >
          <img
            src={selectedPhoto}
            alt="preview"
            className="max-h-[80%] max-w-[80%] object-contain rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
