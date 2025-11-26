import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Avatar from "../../components/ui/avatar/Avatar";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";

const initialReviews = [
  { user: "Alice Johnson", time: "2 days ago", rating: 5, text: "Amazing food and great service! The pizza was perfect.", media: "/images/grid-image/image-02.png", recommended: true },
  { user: "Bob Smith", time: "1 week ago", rating: 4, text: "Good atmosphere and delicious pasta. Will come back!", media: null, recommended: false },
  { user: "Carol Davis", time: "2 weeks ago", rating: 5, text: "Best Italian restaurant in town! The tiramisu is heavenly.", media: "/images/grid-image/image-04.png", recommended: true },
];

function Stars({ count }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < count ? "#F6B100" : "#E5E7EB"}>
          <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.87 1.402-8.168L.132 9.211l8.2-1.193z" />
        </svg>
      ))}
    </div>
  );
}

export default function Reviews() {
  const [filter, setFilter] = useState("all");
  const [reviews, setReviews] = useState(initialReviews);
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const filtered = reviews.filter((r) => (filter === "all" ? true : filter === "positive" ? r.rating >= 4 : r.rating <= 2));
  const removeReview = (idx) => setReviews((prev) => prev.filter((_, i) => i !== idx));
  const toggleRecommend = (idx) => setReviews((prev) => prev.map((r, i) => (i === idx ? { ...r, recommended: !r.recommended } : r)));
  return (
    <>
      <PageMeta title="Reviews & Feedback" description="See customer reviews" />
      <PageBreadcrumb pageTitle="Reviews & Feedback" />
      <ComponentCard>
        <div className="flex items-center justify-between">
          <Select
            options={[
              { value: "all", label: "All Reviews" },
              { value: "positive", label: "Positive" },
              { value: "negative", label: "Negative" },
            ]}
            defaultValue="all"
            onChange={(v) => setFilter(v)}
            className="w-40"
            fullWidth={false}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">Average Rating: {avg}/5</span>
        </div>
      </ComponentCard>

      <div className="space-y-4">
        {filtered.map((r, idx) => (
          <div key={r.user + idx} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="flex items-start gap-4">
              <Avatar src="/images/user/user-01.jpg" size="small" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">{r.user}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{r.time}</p>
                  </div>
                  <Stars count={r.rating} />
                </div>
                <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{r.text}</p>
                {r.media && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Review photo</p>
                    <img src={r.media} alt="review-media" className="mt-2 w-36 h-24 object-cover rounded-md" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => toggleRecommend(reviews.indexOf(r))} className="text-success-600" title="Approve">✓</button>
                <button onClick={() => removeReview(reviews.indexOf(r))} className="text-error-600" title="Delete">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
