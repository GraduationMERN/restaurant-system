import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "timeago.js";
import FeaturedOfferCard from "../offers/FeaturedOfferCard";

export default function ReviewsGrid({ reviews, featuredOffer }) {
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

  const approvedReviews = reviews.filter((review) => review.status === "approved");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:grid-cols-3">
      {/* Featured Offer - Display first on desktop, or after a few reviews on mobile */}
      {featuredOffer && (
        <div className="hidden md:block lg:col-span-2">
          <FeaturedOfferCard offer={featuredOffer} />
        </div>
      )}

      {/* Reviews */}
      {approvedReviews.map((review, index) => {
        // Show featured offer on mobile after 2 reviews
        const showMobileOffer =
          featuredOffer && index === 2 && window.innerWidth < 1024;

        return (
          <React.Fragment key={`review-${review._id}`}>
            {showMobileOffer && (
              <div className="col-span-1 md:hidden">
                <FeaturedOfferCard offer={featuredOffer} />
              </div>
            )}

            <div className="border  dark:bg-gray-800 dark:border-gray-700 p-4 rounded-lg shadow-sm shadow-primary/50 dark:shadow-none">
              {/* User info */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-gray-800 dark:bg-gray-300 flex items-center justify-center text-white font-bold">
                  {getInitials(review.user?.name)}
                </div>
                <span className="font-medium">{review.user?.name || t("anonymous")}</span>
                <p className="text-xs text-gray-500">
                  {format(review.createdAt)}
                </p>
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
          </React.Fragment>
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
