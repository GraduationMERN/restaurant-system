import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchReviews } from "../redux/slices/reviewSlice";
import { useModal } from "../hooks/useModal";
import { useTranslation } from "react-i18next";
import ReviewModal from "../components/reviews/ReviewModal";
import ReviewsGrid from "../components/reviews/ReviewsGrid";
import api from "../api/axios";
import { useToast } from "../hooks/useToast";
import { Star, Sparkles, Users, ChefHat, Award, MessageSquare, Calendar, TrendingUp, ThumbsUp, ExternalLink } from "lucide-react";
import Snowfall from 'react-snowfall';

export default function ReviewsPage() {
  const dispatch = useDispatch();
  const { list: reviews, loading } = useSelector((state) => state.reviews);
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { user } = useSelector((state) => state.auth);

  const { error, warning, success } = useToast();

  useEffect(() => {
    dispatch(fetchReviews());
  }, [dispatch]);

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

  // Calculate stats
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "0.0";
  
  const totalReviews = reviews.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Snowfall />

        {/* CTA Card */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 shadow-lg border border-amber-100 dark:border-amber-800/30">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Share Your Experience
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl">
                  Your feedback helps us improve and tells others about your dining experience. 
                  Every review contributes to our community.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleOpenReviewModal}
                    className="bg-gradient-to-r from-gray-900 to-black dark:from-amber-600 dark:to-orange-600 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Write a Review
                  </button>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Star className="w-4 h-4 fill-current text-amber-500" />
                    <span>Share your honest feedback</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-64 h-48 rounded-xl overflow-hidden shadow-lg">
                  <img 
                    src="https://plus.unsplash.com/premium_photo-1726863151159-56abd4456739?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDN8fHxlbnwwfHx8fHw%3D" 
                    alt="Happy customers enjoying food"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Recent Reviews
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Latest feedback from our guests
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {totalReviews} reviews
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <ReviewsGrid reviews={reviews} />
              
              {/* Center Ad Image - Positioned after first row of reviews */}
              {reviews.length > 3 && (
                <div className="my-12">
                  <div className="bg-gradient-to-r from-gray-900 to-black dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="relative h-64 md:h-80">
                      <img 
                        src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop" 
                        alt="Special dining experience"
                        className="w-full h-full object-cover opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                        <div className="p-8 md:p-12 text-white max-w-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                              <Award className="w-5 h-5" />
                            </div>
                            <span className="text-sm font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                              Featured
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-3xl font-bold mb-3">
                            Exclusive Chef's Table Experience
                          </h3>
                          <p className="text-gray-300 mb-6">
                            Book our premium dining experience with personalized menu and wine pairing. 
                            Limited seats available.
                          </p>
                          <button className="bg-white text-gray-900 font-semibold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300 flex items-center gap-2 group">
                            Learn More
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Be the first to share your dining experience and help others discover our restaurant.
            </p>
            <button
              onClick={handleOpenReviewModal}
              className="bg-gradient-to-r from-gray-900 to-black dark:from-amber-600 dark:to-orange-600 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-xl transition-all duration-300"
            >
              Write First Review
            </button>
          </div>
        )}

        {/* Bottom Section */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verified Reviews
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              All reviews are from customers who have dined with us
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Authentic Feedback</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Every review is verified from actual dining experiences. We value honest feedback to continuously improve our service.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Community Driven</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Your reviews help other guests make informed decisions and guide us in creating better dining experiences.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal isOpen={isOpen} close={closeModal} />
    </div>
  );
}