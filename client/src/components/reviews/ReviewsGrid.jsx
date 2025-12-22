import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "timeago.js";
import { Star, Calendar, Image as ImageIcon, ChevronRight, Quote, Clock, Tag, ChevronLeft, ChevronRight as ChevronRightIcon, X, CheckCircle, ChevronFirst, ChevronLast } from "lucide-react";

export default function ReviewsGrid({ reviews }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { t } = useTranslation();

  // Pagination settings
  const reviewsPerPage = 6;
  const totalPages = Math.ceil(reviews?.length / reviewsPerPage) || 1;

  // Promotional/Ad content data
  const promotionalAds = [
    {
      id: 1,
      title: t("reviews.promotions.weekend_special"),
      subtitle: t("reviews.promotions.family_feast"),
      description: t("reviews.promotions.family_feast_desc"),
      image: "https://plus.unsplash.com/premium_photo-1723662076067-5aa5881e69c0?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8ZmFtaWx5JTIwZmVhc3QlMjBkYXl8ZW58MHx8MHx8fDA%3D",
      ctaText: t("Check Menu Now"),
      badge: "30% OFF", 
      badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      icon: Tag,
      expiresIn: "48:00:00"
    },
    {
      id: 2,
      title: t("reviews.promotions.new_menu_launch"),
      subtitle: t("reviews.promotions.seasonal_specials"),
      description: t("reviews.promotions.seasonal_desc"),
      image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
      ctaText: t("reviews.promotions.view_menu"),
      badge: "NEW",
      badgeColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
      icon: Clock,
      expiresIn: "72:00:00"
    }
  ];

  const featuredAd = promotionalAds[currentAdIndex];

  const handleNextAd = () => {
    setCurrentAdIndex((prev) => (prev + 1) % promotionalAds.length);
  };

  const handlePrevAd = () => {
    setCurrentAdIndex((prev) => (prev - 1 + promotionalAds.length) % promotionalAds.length);
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t("no_reviews")}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Be the first to share your experience
        </p>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return t("anonymous").slice(0, 2).toUpperCase();
    const parts = name.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getAvatarGradient = (name) => {
    const gradients = [
      "from-amber-500 to-orange-600",
      "from-blue-500 to-cyan-600", 
      "from-purple-500 to-pink-600",
      "from-green-500 to-emerald-600",
    ];
    const index = (name?.length || 0) % gradients.length;
    return gradients[index];
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 sm:w-4 sm:h-4 ${i < rating ? "fill-current text-amber-500" : "text-gray-300 dark:text-gray-600"}`}
      />
    ));
  };

  // Calculate paginated reviews
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = reviews.slice(startIndex, endIndex);
  
  // Separate paginated reviews for layout
  const leftReviews = paginatedReviews.filter((_, i) => i % 2 === 0);
  const rightReviews = paginatedReviews.filter((_, i) => i % 2 === 1);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-7 gap-6">
            
            {/* Left Reviews Column */}
            <div className="col-span-2 space-y-6">
              {leftReviews.map((review) => (
                <ReviewCard 
                  key={review._id} 
                  review={review} 
                  t={t} 
                  getInitials={getInitials} 
                  getAvatarGradient={getAvatarGradient} 
                  renderStars={renderStars}
                  setSelectedPhoto={setSelectedPhoto}
                  format={format}
                />
              ))}
            </div>

            {/* Center Featured Ad */}
            <div className="col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg h-fit">
                {/* Ad Image Container */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={featuredAd.image}
                    alt={featuredAd.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`${featuredAd.badgeColor} text-white font-bold py-1.5 px-3 rounded-full text-xs shadow-lg`}>
                      {featuredAd.badge}
                    </span>
                  </div>

                  {/* Navigation */}
                  {promotionalAds.length > 1 && (
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        onClick={handlePrevAd}
                        className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                      >
                        <ChevronLeft className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={handleNextAd}
                        className="w-7 h-7 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                      >
                        <ChevronRightIcon className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Ad Content */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg flex items-center justify-center">
                      <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{featuredAd.subtitle}</p>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">{featuredAd.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {featuredAd.description}
                  </p>

                  {/* Countdown */}
                  <div className="mb-3 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Ends in:</span>
                    </div>
                    <div className="flex gap-1">
                      {featuredAd.expiresIn.split(':').map((unit, index) => (
                        <div key={index} className="flex-1 text-center">
                          <div className="bg-white dark:bg-gray-700 rounded py-1">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{unit}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                            {['H', 'M', 'S'][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 text-sm">
                    {featuredAd.ctaText}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Reviews Column */}
            <div className="col-span-2 space-y-6">
              {rightReviews.map((review) => (
                <ReviewCard 
                  key={review._id} 
                  review={review} 
                  t={t} 
                  getInitials={getInitials} 
                  getAvatarGradient={getAvatarGradient} 
                  renderStars={renderStars}
                  setSelectedPhoto={setSelectedPhoto}
                  format={format}
                />
              ))}
            </div>

          </div>

          {/* Pagination - Desktop */}
          {totalPages > 1 && (
            <div className="mt-6 sm:mt-8 flex items-center justify-center">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 sm:p-3">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="First page"
                >
                  <ChevronFirst className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Last page"
                >
                  <ChevronLast className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2 sm:px-3">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tablet Layout (768px - 1023px) */}
      <div className="hidden md:block lg:hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="space-y-6">
            {/* Featured Ad Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="flex flex-col sm:flex-row">
                {/* Ad Image */}
                <div className="relative w-full sm:w-2/5 h-48 sm:h-auto overflow-hidden">
                  <img
                    src={featuredAd.image}
                    alt={featuredAd.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent sm:from-black/20" />
                  
                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`${featuredAd.badgeColor} text-white font-bold py-1.5 px-3 rounded-full text-xs shadow-lg`}>
                      {featuredAd.badge}
                    </span>
                  </div>
                </div>

                {/* Ad Content */}
                <div className="flex-1 p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg flex items-center justify-center">
                      <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{featuredAd.subtitle}</p>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{featuredAd.title}</h3>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {featuredAd.description}
                  </p>

                  {/* Countdown */}
                  <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Ends in:</span>
                    </div>
                    <div className="flex gap-2">
                      {featuredAd.expiresIn.split(':').map((unit, index) => (
                        <div key={index} className="flex-1 text-center">
                          <div className="bg-white dark:bg-gray-700 rounded py-1.5">
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{unit}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                            {['Hours', 'Minutes', 'Seconds'][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-2.5 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 text-sm">
                      {featuredAd.ctaText}
                    </button>
                    
                    {promotionalAds.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handlePrevAd}
                          className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          onClick={handleNextAd}
                          className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <ChevronRightIcon className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {paginatedReviews.map((review) => (
                <ReviewCard 
                  key={review._id} 
                  review={review} 
                  t={t} 
                  getInitials={getInitials} 
                  getAvatarGradient={getAvatarGradient} 
                  renderStars={renderStars}
                  setSelectedPhoto={setSelectedPhoto}
                  format={format}
                  isTablet={true}
                />
              ))}
            </div>

            {/* Pagination - Tablet */}
            {totalPages > 1 && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      <span>Previous</span>
                    </button>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                    >
                      <span>Next</span>
                      <ChevronRightIcon className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                              : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Layout (< 768px) */}
      <div className="md:hidden">
        <div className="space-y-6">
          {/* Featured Ad Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
            <div className="relative h-40 overflow-hidden">
              <img
                src={featuredAd.image}
                alt={featuredAd.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute top-3 left-3">
                <span className={`${featuredAd.badgeColor} text-white font-bold py-1 px-2 rounded-full text-xs`}>
                  {featuredAd.badge}
                </span>
              </div>

              {promotionalAds.length > 1 && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                  <button
                    onClick={handlePrevAd}
                    className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                  >
                    <ChevronLeft className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={handleNextAd}
                    className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                  >
                    <ChevronRightIcon className="w-3 h-3 text-white" />
                  </button>
                </div>
              )}
            </div>

            <div className="p-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">{featuredAd.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{featuredAd.description}</p>
              <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium py-2 rounded-lg text-sm">
                {featuredAd.ctaText}
              </button>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="space-y-4">
            {paginatedReviews.map((review) => (
              <ReviewCard 
                key={review._id} 
                review={review} 
                t={t} 
                getInitials={getInitials} 
                getAvatarGradient={getAvatarGradient} 
                renderStars={renderStars}
                setSelectedPhoto={setSelectedPhoto}
                format={format}
                isMobile={true}
              />
            ))}
          </div>

          {/* Pagination - Mobile */}
          {totalPages > 1 && (
            <div className="mt-4">
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    <span>Prev</span>
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs"
                  >
                    <span>Next</span>
                    <ChevronRightIcon className="w-3 h-3" />
                  </button>
                </div>
                
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <PhotoModal 
          selectedPhoto={selectedPhoto} 
          setSelectedPhoto={setSelectedPhoto} 
        />
      )}
    </>
  );
}

// Review Card Component - Responsive
const ReviewCard = ({ 
  review, 
  t, 
  getInitials, 
  getAvatarGradient, 
  renderStars, 
  setSelectedPhoto, 
  format,
  isMobile = false,
  isTablet = false
}) => {
  if (review.status !== "approved") return null;

  const userName = review.user?.name || t("anonymous");
  const initials = getInitials(review.user?.name);
  const avatarGradient = getAvatarGradient(review.user?.name);
  const hasPhotos = review.photos && review.photos.length > 0;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-3 sm:p-4 transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${avatarGradient} rounded-lg flex items-center justify-center shadow-md`}>
            <span className="text-white font-bold text-xs sm:text-sm">
              {initials}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
              {userName}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex">
                {renderStars(review.rating)}
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {review.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span className="hidden xs:inline">{format(review.createdAt)}</span>
          <span className="xs:hidden">{format(review.createdAt).replace(/ (minutes|hours|days) ago$/, '')}</span>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-2 sm:mb-3">
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
          {review.comment || t("no_comment")}
        </p>
      </div>

      {/* Photos */}
      {hasPhotos && (
        <div className="mb-2 sm:mb-3">
          <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-2">
            {review.photos.map((photo, index) => (
              <div 
                key={photo.public_id || photo.url || index}
                className="relative flex-shrink-0"
                onClick={() => setSelectedPhoto(photo.url)}
              >
                <img
                  src={photo.url}
                  alt="review"
                  className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
        {/* Empty left side */}
        <div></div>
        
        {review.dishName && (
          <span className="text-xs bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full truncate max-w-[120px] sm:max-w-[150px]">
            {review.dishName}
          </span>
        )}
      </div>
    </div>
  );
};

// Photo Modal Component
const PhotoModal = ({ selectedPhoto, setSelectedPhoto }) => (
  <div
    className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 p-2 sm:p-4"
    onClick={() => setSelectedPhoto(null)}
  >
    <button
      onClick={() => setSelectedPhoto(null)}
      className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-300 z-10"
      aria-label="Close photo viewer"
    >
      <X className="w-5 h-5 sm:w-6 sm:h-6" />
    </button>
    <div className="relative w-full max-w-4xl">
      <img
        src={selectedPhoto}
        alt="preview"
        className="w-full h-auto max-h-[70vh] sm:max-h-[80vh] object-contain rounded-lg"
      />
    </div>
  </div>
);