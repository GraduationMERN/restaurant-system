import React from 'react';
import { ArrowRight } from 'lucide-react';

const FeaturedOfferCard = ({ offer }) => {
  if (!offer) return null;

  const handleCtaClick = () => {
    if (offer.ctaLink) {
      if (offer.ctaLink.startsWith('http')) {
        window.open(offer.ctaLink, '_blank');
      } else {
        window.location.href = offer.ctaLink;
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 row-span-2 md:col-span-2 flex flex-col">
      {/* Image container */}
      <div className="relative h-48 md:h-64 overflow-hidden bg-gradient-to-br from-orange-300 to-orange-500">
        {offer.image?.url ? (
          <img
            src={offer.image.url}
            alt={offer.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500" />
        )}
        {/* Badge */}
        {offer.badge && (
          <div className="absolute top-4 right-4 bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            {offer.badge}
          </div>
        )}
        {/* Discount overlay */}
        {offer.discount > 0 && (
          <div className="absolute bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
            {offer.discount}% OFF
          </div>
        )}
      </div>

      {/* Content container */}
      <div className="p-6 md:p-8 flex flex-col flex-grow justify-between">
        {/* Title and Description */}
        <div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {offer.title}
          </h3>
          {offer.description && (
            <p className="text-white text-opacity-90 text-sm md:text-base mb-4">
              {offer.description}
            </p>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleCtaClick}
          className="mt-6 bg-white text-orange-600 font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors duration-300 shadow-lg hover:shadow-xl w-full"
        >
          {offer.ctaText || 'Shop Now'}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default FeaturedOfferCard;
