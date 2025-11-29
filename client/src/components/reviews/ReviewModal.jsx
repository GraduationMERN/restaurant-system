import React, { useState } from "react";
import { Star, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { createReview, fetchReviews } from "../../redux/slices/reviewSlice";

export default function ReviewModal({ isOpen, close }) {
  const dispatch = useDispatch();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);

  if (!isOpen) return null;

  const handleImageChange = (e) => setImages([...e.target.files]);

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please provide a rating");

    const formData = new FormData();
    formData.append("rating", rating);
    formData.append("comment", comment || "");
    images.forEach((img) => formData.append("photos", img));

    try {
      await dispatch(createReview(formData)).unwrap();
      await dispatch(fetchReviews());
      close();
    } catch (err) {
      console.error("Failed to create review:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white w-11/12 max-w-md rounded-2xl shadow-lg p-6 relative">
        <button className="absolute top-4 right-4 text-muted" onClick={close}>
          <X size={20} />
        </button>
        <h3 className="text-xl font-semibold mb-4">Write a Review</h3>

        <p className="text-sm mb-2 font-medium">Rating</p>
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

        <p className="text-sm mb-2 font-medium">Comment</p>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="w-full h-28 border border-gray-300 rounded-xl p-3 text-sm"
        />

        <p className=" text-sm mb-2 mt-2 font-medium">Upload Photos</p>
        <label className="cursor-pointer bg-white border border-gray-300 px-4 py-2 rounded-xl inline-flex items-center gap-2">
         Choose your photos
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

        <button
          className="w-full mt-4 bg-primary text-white py-2 rounded-xl shadow"
          onClick={handleSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
