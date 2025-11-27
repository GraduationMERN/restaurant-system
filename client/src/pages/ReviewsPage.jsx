import React from "react";
import { Star } from "lucide-react";
const reviews = [
  {
    id: 1,
    name: "Alice Johnson",
    avatar: "https://i.pravatar.cc/40?img=1",
    daysAgo: "2 days ago",
    rating: 5,
    text: "Amazing food and great service! The pizza was perfect.",
    images: ["https://via.placeholder.com/100"],
  },
  {
    id: 2,
    name: "Bob Smith",
    avatar: "https://i.pravatar.cc/40?img=2",
    daysAgo: "1 week ago",
    rating: 4,
    text: "Good atmosphere and delicious pasta. Will come back!",
  },
  {
    id: 3,
    name: "Carol Davis",
    avatar: "https://i.pravatar.cc/40?img=3",
    daysAgo: "2 weeks ago",
    rating: 5,
    text: "Best Italian restaurant in town! The tiramisu is heavenly.",
    images: [
      "https://via.placeholder.com/100",
      "https://via.placeholder.com/120",
    ],
  },
];
export default function ReviewsPage() {
  return (
    <div >
      {/* Main container */}
      <div className="w-full mt-4">
        {/* Title */}
        <h2 className="text-2xl font-bold mb-4">Reviews</h2>

        {/* Write Review Button */}
        <button className="bg-primary text-white w-full px-5 py-2 rounded-xl shadow mb-8">
          + Write a Review
        </button>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-surface shadow rounded-2xl p-4 flex flex-col gap-3 border border-muted"
            >
              {/* Avatar + name + time */}
              <div className="flex items-center gap-3 w-full">
                <img
                  src={review.avatar}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />

                <div className="flex justify-between w-full">
                  <p className="font-semibold text-on-surface">{review.name}</p>
                  <p className="text-xs text-muted">{review.daysAgo}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: review.rating }).map((_, idx) => (
                  <Star
                    key={idx}
                    size={16}
                    className="fill-warning text-warning"
                  />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-muted text-sm leading-relaxed">
                {review.text}
              </p>

              {/* Optional Image */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {review.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt="review"
                      className="w-24 h-24 rounded-lg object-cover border border-muted"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
