// import React, { useState } from "react";
// import { useTranslation } from "react-i18next";
// import { format } from "timeago.js";
// import { Star, Calendar, User, Image as ImageIcon, ChevronRight, Quote } from "lucide-react";

// export default function ReviewsGrid({ reviews }) {
//   const [selectedPhoto, setSelectedPhoto] = useState(null);
//   const [hoveredReview, setHoveredReview] = useState(null);
//   const { t } = useTranslation();

//   if (!reviews || reviews.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
//           <Quote className="w-10 h-10 text-gray-400 dark:text-gray-500" />
//         </div>
//         <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
//           {t("no_reviews")}
//         </h3>
//         <p className="text-gray-600 dark:text-gray-400">
//           Be the first to share your experience
//         </p>
//       </div>
//     );
//   }

//   const getInitials = (name) => {
//     if (!name) return t("anonymous").slice(0, 2).toUpperCase();
//     const parts = name.split(" ");
//     return parts.length === 1
//       ? parts[0][0].toUpperCase()
//       : (parts[0][0] + parts[1][0]).toUpperCase();
//   };

//   // Get gradient color based on name
//   const getAvatarGradient = (name) => {
//     const gradients = [
//       "from-amber-500 to-orange-600",
//       "from-blue-500 to-cyan-600", 
//       "from-purple-500 to-pink-600",
//       "from-green-500 to-emerald-600",
//       "from-gray-600 to-gray-800",
//     ];
//     const index = (name?.length || 0) % gradients.length;
//     return gradients[index];
//   };

//   // Render star rating with hover effect
//   const renderStars = (rating) => {
//     return Array.from({ length: 5 }).map((_, i) => (
//       <div key={i} className="relative group">
//         <Star
//           className={`w-4 h-4 transition-all duration-200 ${
//             i < rating 
//               ? "fill-current text-amber-500 group-hover:scale-125" 
//               : "text-gray-300 dark:text-gray-700 group-hover:text-gray-400 dark:group-hover:text-gray-600"
//           }`}
//         />
//       </div>
//     ));
//   };

//   return (
//     <>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {reviews.map((review) => {
//           if (review.status !== "approved") return null;

//           const userName = review.user?.name || t("anonymous");
//           const initials = getInitials(review.user?.name);
//           const avatarGradient = getAvatarGradient(review.user?.name);
//           const hasPhotos = review.photos && review.photos.length > 0;

//           return (
//             <div
//               key={review._id}
//               className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 p-6 transition-all duration-300 hover:-translate-y-2 cursor-pointer relative overflow-hidden"
//               onMouseEnter={() => setHoveredReview(review._id)}
//               onMouseLeave={() => setHoveredReview(null)}
//             >
//               {/* Hover background effect */}
//               <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/30 dark:to-gray-800/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
//               {/* Quote icon - appears on hover */}
//               <Quote className="absolute top-4 right-4 w-8 h-8 text-gray-200 dark:text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
//               <div className="relative z-10">
//                 {/* Review Header */}
//                 <div className="flex items-center gap-4 mb-6">
//                   {/* Avatar with gradient */}
//                   <div className={`w-14 h-14 bg-gradient-to-br ${avatarGradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
//                     <span className="text-white font-bold text-lg">
//                       {initials}
//                     </span>
//                   </div>
                  
//                   <div className="flex-1">
//                     <div className="flex items-start justify-between">
//                       <div>
//                         <h4 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
//                           {userName}
//                         </h4>
//                         <div className="flex items-center gap-3">
//                           <div className="flex gap-0.5">
//                             {renderStars(review.rating)}
//                           </div>
//                           <span className="text-sm font-medium text-gray-900 dark:text-white">
//                             {review.rating.toFixed(1)}
//                           </span>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
//                         <Calendar className="w-3 h-3" />
//                         <span>{format(review.createdAt)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Review Content */}
//                 <div className="mb-6">
//                   <p className="text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all duration-300">
//                     {review.comment || t("no_comment")}
//                   </p>
//                 </div>

//                 {/* Photos Section */}
//                 {hasPhotos && (
//                   <div className="mb-6">
//                     <div className="flex items-center gap-2 mb-3">
//                       <ImageIcon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
//                       <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
//                         {review.photos.length} photo{review.photos.length > 1 ? 's' : ''}
//                       </span>
//                     </div>
                    
//                     <div className="flex gap-2 flex-wrap">
//                       {review.photos.slice(0, 3).map((photo, index) => (
//                         <div 
//                           key={photo.public_id || photo.url || index}
//                           className="relative group/image"
//                           onClick={(e) => {
//                             e.stopPropagation();
//                             setSelectedPhoto(photo.url);
//                           }}
//                         >
//                           <img
//                             src={photo.url}
//                             alt="review"
//                             className="h-20 w-20 object-cover rounded-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg"
//                           />
//                           {/* Overlay on hover */}
//                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
//                             <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center">
//                               <ChevronRight className="w-4 h-4 text-gray-900 rotate-90" />
//                             </div>
//                           </div>
//                         </div>
//                       ))}
                      
//                       {/* Show more indicator */}
//                       {review.photos.length > 3 && (
//                         <div className="relative">
//                           <div className="h-20 w-20 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
//                             <span className="text-gray-900 dark:text-white font-bold">
//                               +{review.photos.length - 3}
//                             </span>
//                           </div>
//                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
//                             <span className="text-white text-sm font-medium">
//                               View all
//                             </span>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}

//                 {/* Verified Badge */}
//                 <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
//                   <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
//                     <div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full"></div>
//                   </div>
//                   <span className="text-xs text-gray-500 dark:text-gray-400">
//                     Verified purchase
//                   </span>
//                 </div>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* Photo Modal */}
//       {selectedPhoto && (
//         <div
//           className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
//           onClick={() => setSelectedPhoto(null)}
//         >
//           <div className="relative max-w-4xl w-full max-h-[90vh]">
//             <button
//               onClick={() => setSelectedPhoto(null)}
//               className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
//             >
//               <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20">
//                 <span className="text-xl">×</span>
//               </div>
//             </button>
//             <img
//               src={selectedPhoto}
//               alt="preview"
//               className="w-full h-full object-contain rounded-lg shadow-2xl"
//             />
//           </div>
//         </div>
//       )}

//       {/* Animation styles */}
//       <style jsx>{`
//         @keyframes fadeIn {
//           from { opacity: 0; }
//           to { opacity: 1; }
//         }
//         .animate-fadeIn {
//           animation: fadeIn 0.2s ease-out forwards;
//         }
//       `}</style>
//     </>
//   );
// } 

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "timeago.js";
import { Star, Calendar, Image as ImageIcon, ChevronRight, Quote, Clock, Tag, ChevronLeft, ChevronRight as ChevronRightIcon, X, CheckCircle } from "lucide-react";

export default function ReviewsGrid({ reviews }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const { t } = useTranslation();

  // Promotional/Ad content data
  const promotionalAds = [
    {
      id: 1,
      title: "Weekend Special",
      subtitle: "Family Feast Deal",
      description: "Enjoy our exclusive weekend family bundle with 30% off all appetizers and desserts. Perfect for gatherings!",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop",
      ctaText: "Book Now",
      badge: "30% OFF",
      badgeColor: "bg-gradient-to-r from-amber-500 to-orange-500",
      icon: Tag,
      expiresIn: "48:00:00"
    },
    {
      id: 2,
      title: "New Menu Launch",
      subtitle: "Seasonal Specials",
      description: "Experience our chef's new seasonal creations featuring fresh, locally-sourced ingredients.",
      image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&h=800&fit=crop",
      ctaText: "View Menu",
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
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <Quote className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {t("no_reviews")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
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
        className={`w-4 h-4 ${i < rating ? "fill-current text-amber-500" : "text-gray-300 dark:text-gray-600"}`}
      />
    ));
  };

  // Separate reviews for layout
  const leftReviews = reviews.filter((_, i) => i % 2 === 0);
  const rightReviews = reviews.filter((_, i) => i % 2 === 1);

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-7 gap-8">
            
            {/* Left Reviews Column */}
            <div className="col-span-2 space-y-6">
              {leftReviews.slice(0, 3).map((review) => (
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

            {/* Center Featured Ad - Takes 3 columns */}
            <div className="col-span-3">
              <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl h-full">
                {/* Ad Image Container */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={featuredAd.image}
                    alt={featuredAd.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`${featuredAd.badgeColor} text-white font-bold py-2 px-4 rounded-full text-sm shadow-lg`}>
                      {featuredAd.badge}
                    </span>
                  </div>

                  {/* Navigation */}
                  {promotionalAds.length > 1 && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        onClick={handlePrevAd}
                        className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                      >
                        <ChevronLeft className="w-4 h-4 text-white" />
                      </button>
                      <button
                        onClick={handleNextAd}
                        className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30"
                      >
                        <ChevronRightIcon className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Ad Content */}
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl flex items-center justify-center">
                      <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{featuredAd.subtitle}</p>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{featuredAd.title}</h3>
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {featuredAd.description}
                  </p>

                  {/* Countdown */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Offer ends in:</span>
                    </div>
                    <div className="flex gap-2">
                      {featuredAd.expiresIn.split(':').map((unit, index) => (
                        <div key={index} className="flex-1 text-center">
                          <div className="bg-white dark:bg-gray-700 rounded-lg py-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{unit}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                            {['Hours', 'Minutes', 'Seconds'][index]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold py-3 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-300">
                    {featuredAd.ctaText}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Reviews Column */}
            <div className="col-span-2 space-y-6">
              {rightReviews.slice(0, 3).map((review) => (
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
        </div>
      </div>

      {/* Mobile & Tablet Layout */}
      <div className="lg:hidden">
        <div className="space-y-8">
          {/* Featured Ad Card - Top on mobile */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="relative h-56 overflow-hidden">
              <img
                src={featuredAd.image}
                alt={featuredAd.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              <div className="absolute top-4 left-4">
                <span className={`${featuredAd.badgeColor} text-white font-bold py-1 px-3 rounded-full text-sm`}>
                  {featuredAd.badge}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{featuredAd.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{featuredAd.description}</p>
              <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium py-2 rounded-lg">
                {featuredAd.ctaText}
              </button>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.slice(0, 6).map((review) => (
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

// Review Card Component - Clean and consistent
const ReviewCard = ({ 
  review, 
  t, 
  getInitials, 
  getAvatarGradient, 
  renderStars, 
  setSelectedPhoto, 
  format,
  isMobile = false 
}) => {
  if (review.status !== "approved") return null;

  const userName = review.user?.name || t("anonymous");
  const initials = getInitials(review.user?.name);
  const avatarGradient = getAvatarGradient(review.user?.name);
  const hasPhotos = review.photos && review.photos.length > 0;

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-5 transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-gradient-to-br ${avatarGradient} rounded-xl flex items-center justify-center shadow-md`}>
            <span className="text-white font-bold">
              {initials}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
              {userName}
            </h4>
            <div className="flex items-center gap-2 mt-1">
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
          <span>{format(review.createdAt)}</span>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {review.comment || t("no_comment")}
        </p>
      </div>

      {/* Photos */}
      {hasPhotos && (
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {review.photos.map((photo, index) => (
              <div 
                key={photo.public_id || photo.url || index}
                className="relative flex-shrink-0"
                onClick={() => setSelectedPhoto(photo.url)}
              >
                <img
                  src={photo.url}
                  alt="review"
                  className="h-16 w-16 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-green-500" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Verified purchase
          </span>
        </div>
        
        {review.dishName && (
          <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
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
    className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 p-4"
    onClick={() => setSelectedPhoto(null)}
  >
    <button
      onClick={() => setSelectedPhoto(null)}
      className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
    >
      <X className="w-6 h-6" />
    </button>
    <div className="relative max-w-4xl w-full">
      <img
        src={selectedPhoto}
        alt="preview"
        className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
      />
    </div>
  </div>
);