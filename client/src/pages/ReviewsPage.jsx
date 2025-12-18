import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviews } from "../redux/slices/reviewSlice";
import { useModal } from "../hooks/useModal";
import { useTranslation } from "react-i18next";
import ReviewModal from "../components/reviews/ReviewModal";
import ReviewsGrid from "../components/reviews/ReviewsGrid";
import api from "../api/axios";
import { useToast } from "../hooks/useToast";

export default function ReviewsPage() {
  const dispatch = useDispatch();
  const { list: reviews, loading } = useSelector((state) => state.reviews);
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);
  const [offers, setOffers] = useState([]);

  const { error, warning, success } = useToast();

  // Fetch reviews
  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

  // Fetch active offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await api.get("/api/offers");
        if (res.data?.success && res.data?.data) {
          setOffers(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch offers:", err);
        // Silently fail - offers are optional
      }
    };

    fetchOffers();
  }, []);

  const handleOpenReviewModal = async () => {
    if (!user?.id) {
      return warning("You must be logged in to write a review.");
    }

    try {
      const res = await api.get("api/auth/me");

      if (res.data.orderCount < 1) {
        return warning("You must complete at least one order before reviewing.");
      }

      success("Great! You can now leave a review.");
      openModal();
    } catch (err) {
      console.error(err);
      error("Unable to verify review permissions.");
    }
  };

  const featuredOffer = offers.length > 0 ? offers[0] : null;

  return (
    <div className="ms-10 me-10 my-10">
      <h2 className="text-2xl font-bold mb-4">{t("reviews")}</h2>

      {/* <button
        onClick={handleOpenReviewModal}
        className="bg-primary text-white px-5 py-2 rounded-xl shadow mb-8 hover:opacity-90 transition-all"
      >
        + {t("write_review")}
      </button> */}

      <ReviewModal isOpen={isOpen} close={closeModal} />

      {loading ? <p>{t("loading")}</p> : <ReviewsGrid reviews={reviews} featuredOffer={featuredOffer} />}
    </div>
  );
}
