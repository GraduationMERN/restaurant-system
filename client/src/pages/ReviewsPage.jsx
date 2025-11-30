import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviews } from "../redux/slices/reviewSlice";
import { useModal } from "../hooks/useModal";

import ReviewModal from "../components/reviews/ReviewModal";
import ReviewsGrid from "../components/reviews/ReviewsGrid";

export default function ReviewsPage() {
  const dispatch = useDispatch();
  const { list: reviews, loading } = useSelector((state) => state.reviews);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  return (
    <div className="ms-20 me-10 my-10">
      <h2 className="text-2xl font-bold mb-4">Reviews</h2>

      <button
        onClick={openModal}
        className="bg-primary text-white px-5 py-2 rounded-xl shadow mb-8"
      >
        + Write a Review
      </button>

      <ReviewModal isOpen={isOpen} close={closeModal} />

      {loading ? <p>Loading...</p> : <ReviewsGrid reviews={reviews} />}
    </div>
  );
}
