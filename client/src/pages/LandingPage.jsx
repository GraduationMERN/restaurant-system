import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowRight,
  ChefHat,
  MapPin,
  Phone,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  Heart,
  Instagram,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSettings } from "../context/SettingContext";
import LocationMap from "../components/home/LocationMap";
import { useSelector, useDispatch } from 'react-redux';
import { fetchReviews } from '../redux/slices/reviewSlice';

// Error Boundary for safety
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LandingPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Landing Page</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function LandingPageContent() {
  const { settings, rawSettings, loading: settingsLoading } = useSettings();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Enhanced debug logging
  useEffect(() => {
    console.log('=== LANDING PAGE LOAD DEBUG ===');
    console.log('1. Settings loading:', settingsLoading);
    console.log('2. Raw settings loaded:', !!rawSettings);
    console.log('3. Has systemSettings:', !!rawSettings?.systemSettings);
    console.log('4. Has landing data:', !!rawSettings?.systemSettings?.landing);
    
    if (rawSettings?.systemSettings?.landing) {
      const landingData = rawSettings.systemSettings.landing;
      console.log('5. Landing data structure:', Object.keys(landingData));
      console.log('6. Hero section:', landingData.hero);
      console.log('7. Services section:', landingData.services);
      console.log('8. Services items:', landingData.services?.items);
      console.log('9. Services items count:', landingData.services?.items?.length);
      
      // Check specific values
      console.log('10. Hero title:', landingData.hero?.title || 'NOT SET');
      console.log('11. Hero subtitle:', landingData.hero?.subtitle || 'NOT SET');
      console.log('12. Services enabled:', landingData.services?.enabled !== false);
    }
  }, [rawSettings, settingsLoading]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Get landing settings from systemSettings - FIXED with better fallbacks
  const landing = useMemo(() => {
    return rawSettings?.systemSettings?.landing || {};
  }, [rawSettings]);

  // Destructure with better fallbacks
  const hero = landing?.hero || {};
  const about = landing?.about || {};
  const testimonials = landing?.testimonials || {};
  const contact = landing?.contact || {};
  const callUs = landing?.callUs || {};
  const footer = landing?.footer || {};
  const seo = landing?.seo || {};
  const services = landing?.services || {};
  const instagram = landing?.instagram || {};
  const specialOffer = landing?.specialOffer || {};
  const location = landing?.location || {};
  const hours = landing?.hours || {};

  // Check if sections are enabled - FIXED: Use explicit check for undefined
  const heroEnabled = hero.enabled !== false;
  const aboutEnabled = about.enabled !== false;
  const testimonialsEnabled = testimonials.enabled !== false;
  const contactEnabled = contact.enabled !== false;
  const servicesEnabled = services.enabled !== false;
  const instagramEnabled = instagram.enabled !== false;
  const specialOfferEnabled = specialOffer.enabled !== false;
  const locationEnabled = location.enabled !== false;

  // Get testimonials items
  const reduxReviews = useSelector(s => s.reviews?.list || []);
  const dispatch = useDispatch();

  // Ensure public landing page loads approved reviews so featuredIds map correctly
  useEffect(() => {
    try {
      dispatch(fetchReviews());
    } catch (err) {
      console.warn('Failed to fetch reviews for landing page', err);
    }
  }, [dispatch]);
  let testimonialItems = useMemo(() => {
    const items = testimonials.items || [];
    if ((testimonials.mode || 'all') === 'all') {
      return reduxReviews;
    } else if ((testimonials.mode || '') === 'selected' && (testimonials.featuredIds || []).length) {
      return (testimonials.featuredIds || []).map(id => reduxReviews.find(r => r._id === id)).filter(Boolean);
    }
    return items;
  }, [testimonials, reduxReviews]);

  // Get enabled services - FIXED: Added better fallbacks
  const actionCards = useMemo(() => {
    const enabledServices = (services.items || []).filter(service => service.enabled !== false);
    return enabledServices.map(service => ({
      image: service.image || '',
      title: isRTL ? (service.titleAr || service.title || '') : (service.title || ''),
      description: isRTL ? (service.descriptionAr || service.description || '') : (service.description || ''),
      color: service.colorClass || '',
      bgColor: service.bgClass || '',
      imageBg: service.imageBgClass || '',
      navigate: service.navigate || '/',
    }));
  }, [services, isRTL]);

  // Instagram posts
  const instagramPosts = useMemo(() => landing.instagram?.posts || [], [landing]);

  // Apply SEO
  useEffect(() => {
    if (seo.title) {
      document.title = seo.title;
    } else if (settings.restaurantName) {
      document.title = settings.restaurantName;
    } else {
      document.title = t("welcome");
    }

    const meta = document.querySelector('meta[name="description"]');
    const description = seo.description || settings.description || "";
    if (meta) {
      meta.setAttribute('content', description);
    } else if (description) {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = description;
      document.head.appendChild(m);
    }
  }, [seo, settings, t]);

  // Image expansion functions
  const handleImageExpand = (index) => {
    if (!instagramPosts || instagramPosts.length === 0) return;
    const idx = Math.max(0, Math.min(index, instagramPosts.length - 1));
    setActiveImageIndex(idx);
    setExpandedImage(instagramPosts[idx]);
    document.body.style.overflow = 'hidden';
  };

  const handleImageClose = () => {
    setExpandedImage(null);
    document.body.style.overflow = 'auto';
  };

  const handleNextImage = () => {
    if (!instagramPosts || instagramPosts.length === 0) return;
    const newIndex = (activeImageIndex + 1) % instagramPosts.length;
    setActiveImageIndex(newIndex);
    setExpandedImage(instagramPosts[newIndex]);
  };

  const handlePrevImage = () => {
    if (!instagramPosts || instagramPosts.length === 0) return;
    const newIndex = (activeImageIndex - 1 + instagramPosts.length) % instagramPosts.length;
    setActiveImageIndex(newIndex);
    setExpandedImage(instagramPosts[newIndex]);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!expandedImage) return;
      if (e.key === 'Escape') handleImageClose();
      if (e.key === 'ArrowRight') handleNextImage();
      if (e.key === 'ArrowLeft') handlePrevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandedImage]);

  // Render section only if enabled
  const renderSection = (enabled, children) => {
    if (!enabled) return null;
    return children;
  };

  // Show loading state
  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading landing page...</p>
        </div>
      </div>
    );
  }

  // SVG pattern
  const svgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  return (
    <div className={`min-h-screen dark:bg-gray-900 transition-all duration-1000 ${isRTL ? "rtl" : "ltr"}`}>
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-amber-200/20 dark:bg-orange-500/10 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Expanded Image Overlay */}
      {expandedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-all duration-500"
            onClick={handleImageClose}
          />
          
          {/* Close button */}
          <button
            onClick={handleImageClose}
            className="absolute top-6 right-6 md:top-8 md:right-8 z-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Navigation buttons */}
          <button
            onClick={handlePrevImage}
            className="absolute left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={handleNextImage}
            className="absolute right-4 md:right-8 top-1/2 transform -translate-y-1/2 z-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Expanded image container */}
          <div className="relative z-20 w-full max-w-4xl animate-expandImage">
            <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="relative">
                {expandedImage?.image ? (
                  <img
                    src={expandedImage.image}
                    alt="Expanded post"
                    className="w-full h-[40vh] md:h-[50vh] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-[40vh] md:h-[50vh] bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <span className="text-gray-500">No image provided</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8">
                  <div className="text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 fill-current" />
                        <span className="text-lg font-semibold">{expandedImage?.likes || '0'}</span>
                      </div>
                      <div className="flex-1" />
                      <span className="text-sm opacity-90">{expandedImage?.date || ''}</span>
                    </div>
                    <p className="text-base md:text-lg mb-3">{expandedImage?.caption || ''}</p>
                    <div className="flex flex-wrap gap-2">
                      {(expandedImage?.tags || []).map((tag, i) => (
                        <span key={i} className="px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Image counter */}
            <div className="text-center mt-4">
              <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
                {activeImageIndex + 1} / {instagramPosts.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Data Status Indicator (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-10 bg-black/80 text-white text-xs p-2 rounded">
          <div>Landing Data: {landing ? 'Loaded' : 'Missing'}</div>
          <div>Services: {actionCards.length} items</div>
        </div>
      )}

      <div className="relative z-10 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-6xl w-full">
          {/* HERO SECTION - Only if enabled */}
          {renderSection(heroEnabled, (
            <div
              className={`text-center mb-12 md:mb-16 transition-all duration-1000 ${
                isLoaded
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="relative w-48 h-48 md:w-56 md:h-56 mx-auto mb-8">
                {/* Decorative circle */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-primary/30 to-secondary/20 rounded-full opacity-25 animate-pulse-slow" />
                <div className="absolute inset-3 rounded-full border-4 border-white/60 dark:border-gray-700/60" />
                <div className="absolute inset-6 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/20 dark:ring-gray-800/20 transition-transform duration-500 group-hover:scale-105">
                  {(() => {
                    const heroImageSrc = hero.image || settings.branding?.logoUrl || '';
                    if (heroImageSrc) {
                      return (
                        <img
                          src={heroImageSrc}
                          alt={hero.title || settings.restaurantName || t("welcome")}
                          className="w-full h-full object-cover object-center"
                          loading="lazy"
                        />
                      );
                    }
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                        <ChefHat className="w-12 h-12 text-gray-400" />
                      </div>
                    );
                  })()}
                </div>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary/40 via-primary to-secondary bg-clip-text text-transparent dark:from-amber-400 dark:via-orange-400 dark:to-amber-300 mb-4 font-serif tracking-tight">
                {isRTL 
                  ? (hero.titleAr || hero.title || settings.restaurantName || t("welcome")) 
                  : (hero.title || settings.restaurantName || t("welcome"))}
              </h1>

              <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
                {isRTL 
                  ? (hero.subtitleAr || hero.subtitle || settings.description) 
                  : (hero.subtitle || settings.description)}
              </p>

              {/* Decorative separator */}
              <div className="hidden lg:flex items-center justify-center gap-4 mt-8">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-secondary dark:to-secondary" />
                <ChefHat className="w-6 h-6 text-secondary" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-secondary dark:to-secondary" />
              </div>
            </div>
          ))}

          {/* SERVICES CARDS - Only if enabled and has items */}
          {renderSection(servicesEnabled && actionCards.length > 0, (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {actionCards.map((card, index) => (
                <button
                  key={index}
                  aria-label={`Open ${card.title || 'service'}`}
                  onClick={() => card.navigate && navigate(card.navigate)}
                  className={`${card.bgColor || 'bg-white dark:bg-gray-800'} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 dark:border-gray-700/50 group text-left backdrop-blur-sm hover:-translate-y-2 active:scale-[0.98] overflow-hidden ${
                    isRTL ? "text-right" : ""
                  } ${isLoaded ? `animate-slide-up` : "opacity-0"}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`flex items-start justify-between mb-5 ${isRTL ? "flex-row-reverse" : ""}`}>
                    <div className={`w-16 h-16 md:w-20 md:h-20 ${card.imageBg || 'bg-gray-100 dark:bg-gray-700'} rounded-2xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-md relative flex-shrink-0`}> 
                      <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent z-10" />
                      {card.image ? (
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <Sparkles className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                        isRTL
                          ? "rotate-180 group-hover:-translate-x-1"
                          : "group-hover:translate-x-1"
                      }`}
                    />
                  </div>
                  <h3 className={`text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2`}>
                    {card.title || 'Service Title'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {card.description || 'Service description goes here...'}
                  </p>
                </button>
              ))}
            </div>
          ))}

          {/* ABOUT SECTION - Moved: Shows between Services and Special Offer */}
          {renderSection(aboutEnabled, (
            <div className={`mb-12 transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="w-full h-56 md:h-80 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden flex items-center justify-center">
                  {about.image ? (
                    <img src={about.image} alt={about.title || settings.restaurantName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-6 text-center">
                      <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-500">{t('about_placeholder') || 'About image placeholder'}</p>
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    {isRTL ? (about.titleAr || about.title || t('about_us')) : (about.title || t('about_us'))}
                  </h2>
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line mb-6">
                    {isRTL ? (about.contentAr || about.content || t('about_description')) : (about.content || t('about_description'))}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => navigate('/support')} className="px-5 py-3 bg-primary text-white rounded-lg">{t('Learn more') || 'Learn more'}</button>
                    <button onClick={() => navigate('/menu')} className="px-5 py-3 bg-secondary text-white rounded-lg">{t('View Menu') || 'View Menu'}</button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* SPECIAL OFFER - Only if enabled (moved after About) */}
          {renderSection(specialOfferEnabled, (
            <div
              className={`relative overflow-hidden rounded-3xl mb-12 transition-all duration-700 ${
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {/* Background pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/70 via-secondary to-primary" />
              <div
                className="absolute inset-0 opacity-10"
                style={{ backgroundImage: svgPattern }}
              />

              <div className="relative p-8 md:p-12 text-white">
                <div className={`flex flex-col md:flex-row items-center justify-between gap-8 mb-8 ${isRTL ? "md:flex-row-reverse" : ""}`}>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce-slow">
                        <ChefHat className="w-10 h-10" />
                      </div>
                      <TrendingUp className="absolute -top-2 -right-2 w-6 h-6 text-green-300" />
                    </div>
                    <div>
                      <div className="text-5xl font-bold flex items-baseline gap-2">
                        20%
                        <span className="text-xl font-medium opacity-90">
                          {t("off", "OFF")}
                        </span>
                      </div>
                      <p className="text-lg opacity-90 mt-2">
                        {t("special_offer")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Users className="w-8 h-8 text-amber-200" />
                    <div className={isRTL ? "text-right" : "text-left"}>
                      <p className="text-sm opacity-80">
                        {t("Special Rewards for Customers")}
                      </p>
                      <p className="text-lg font-semibold">
                        {t("Join 500+ Happy Customers")}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/login")}
                  className="w-full md:w-auto bg-white text-secondary font-bold py-4 px-8 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl text-lg group flex items-center justify-center gap-3"
                >
                  <span>{t("Register_rewards")}</span>
                  <ArrowRight
                    className={`w-5 h-5 transition-transform ${
                      isRTL
                        ? "rotate-180 group-hover:-translate-x-1"
                        : "group-hover:translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}

          {/* INSTAGRAM FEED - Only if enabled */}
          {renderSection(instagramEnabled && instagramPosts.length > 0, (
            <div className={`mb-12 transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 mb-6">
                  <Instagram className="w-8 h-8 text-pink-600 dark:text-pink-500" />
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {t("Follow Us")}
                  </h2>
                </div>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {t("instagram_tag")}{" "}
                  <span className="font-bold text-amber-600 dark:text-amber-500">
                    @{settings.restaurantName?.replace(/\s+/g, "") || "restaurant"}
                  </span>
                </p>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {instagramPosts.map((post, i) => (
                  <div 
                    key={i} 
                    role="button"
                    aria-label={`Open Instagram post ${i + 1}`}
                    className="relative group overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 aspect-square"
                    onClick={() => handleImageExpand(i)}
                  >
                    {post.image ? (
                      <img 
                        src={post.image} 
                        alt={`Instagram post ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Instagram className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="text-white w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Heart className="w-4 h-4 fill-current" />
                            <span className="font-semibold text-sm">{post.likes || '0'}</span>
                          </div>
                          <span className="text-xs opacity-90">#{(post.tags || [])[0] || ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Click indicator */}
                    <div className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-4 h-4 border border-white rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <a 
                  href={`https://instagram.com/${settings.restaurantName?.replace(/\s+/g, '') || "restaurant"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-gradient-to-r from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Instagram className="w-5 h-5" />
                  Follow on Instagram
                </a>
              </div>
            </div>
          ))}

          {/* TESTIMONIALS - Only if enabled */}
          {renderSection(testimonialsEnabled && testimonialItems.length > 0, (
            <div className={`mb-12 transition-all duration-700 ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
              <div className="max-w-4xl mx-auto text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                  {isRTL ? (testimonials.titleAr || testimonials.title || t('What People Say')) : (testimonials.title || t('What People Say'))}
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {testimonialItems.map((tst, i) => (
                    <div key={i} className="p-6 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-md">
                      <p className="text-gray-700 dark:text-gray-200 mb-4">{tst.content || tst.comment || ''}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{tst.name || tst.userName || 'Customer'}</span>
                        <span className="text-amber-500">
                          {Array.from({length: (tst.rating || 5)}).map((_,k)=>("★")).join('')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* CONTACT & LOCATION - Only if enabled */}
          {renderSection(contactEnabled || locationEnabled, (
            <div
              className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50 dark:border-gray-700/50 transition-all duration-700 ${
                isLoaded
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10"
              }`}
            >
              {contactEnabled && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {[
                    {
                      icon: MapPin,
                      title: t("location"),
                      content: isRTL 
                        ? (location.addressAr || location.address || t('address_not_set'))
                        : (location.address || t('address_not_set')),
                      color: "text-green-600 dark:text-green-400",
                      bgColor: "bg-green-100 dark:bg-green-900/20",
                    },
                    {
                      icon: Phone,
                      title: callUs.label || callUs.labelAr || t("call_us"),
                      content: isRTL 
                        ? (callUs.numberAr || callUs.number || contact.phone || t('phone_not_set'))
                        : (callUs.number || contact.phone || t('phone_not_set')),
                      color: "text-purple-600 dark:text-purple-400",
                      bgColor: "bg-purple-100 dark:bg-purple-900/20",
                    },
                    {
                      icon: Clock,
                      title: t("opening_hours"),
                      content: (hours && Object.keys(hours).length > 0 && Object.values(hours).some(d=>d.enabled !== false))
                        ? Object.entries(hours)
                            .filter(([_, times]) => times.enabled !== false)
                            .map(([day, times]) => 
                              `${day.charAt(0).toUpperCase() + day.slice(1)}: ${times.open} - ${times.close}`
                            )
                            .join('\n')
                        : t('hours_not_set'),
                      color: "text-amber-600 dark:text-amber-400",
                      bgColor: "bg-amber-100 dark:bg-amber-900/20",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-4 p-6 rounded-2xl bg-gradient-to-r from-transparent to-white/30 dark:to-gray-900/30 hover:to-white/50 dark:hover:to-gray-800/50 transition-all duration-300 ${
                        isRTL ? "flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-14 h-14 ${item.bgColor} rounded-2xl flex items-center justify-center shadow-md`}
                      >
                        <item.icon className={`w-7 h-7 ${item.color}`} />
                      </div>
                      <div className={isRTL ? "text-right" : "text-left"}>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LOCATION MAP - Only if enabled */}
              {renderSection(locationEnabled && (location.latitude && location.longitude), (
                <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <MapPin className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                      {t("find_us")}
                    </h3>
                  </div>
                  <LocationMap 
                    lat={parseFloat(location.latitude)}
                    lng={parseFloat(location.longitude)}
                    address={location.address}
                  />
                </div>
              ))}
            </div>
          ))}

          {/* FOOTER - Modern multi-column footer */}
          {renderSection(footer.enabled !== false, (
            <footer className="mt-12 bg-gradient-to-r from-primary/6 via-primary/4 to-secondary/6 dark:from-primary-900 dark:to-secondary-900 text-gray-800 dark:text-gray-200 rounded-2xl p-8">
              <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 dark:bg-primary/800 flex items-center justify-center">
                      {settings.branding?.logoUrl ? (
                        <img src={settings.branding.logoUrl} alt={settings.restaurantName} className="w-10 h-10 object-contain" />
                      ) : (
                        <ChefHat className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{settings.restaurantName || t('Restaurant')}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">{settings.description || ''}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm mt-3">
                    <a href={`https://instagram.com/${settings.restaurantName?.replace(/\s+/g, '') || 'restaurant'}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-pink-500 hover:underline">
                      <Instagram className="w-5 h-5" />
                      <span>@{settings.restaurantName?.replace(/\s+/g, '') || 'restaurant'}</span>
                    </a>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <h4 className="font-semibold mb-3">Quick Links</h4>
                  <ul className="space-y-2 text-sm">
                    <li><button className="hover:underline text-left" onClick={()=>navigate('/menu')}>Menu</button></li>
                    <li><button className="hover:underline text-left" onClick={()=>navigate('/orders')}>Orders</button></li>
                    <li><button className="hover:underline text-left" onClick={()=>navigate('/reviews')}>Reviews</button></li>
                    <li><button className="hover:underline text-left" onClick={()=>navigate('/contact')}>Contact</button></li>
                  </ul>
                </div>

                <div className="md:col-span-3">
                  <h4 className="font-semibold mb-3">Contact</h4>
                  <div className="text-sm space-y-2">
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> <span>{location.address || settings.address || t('address_not_set')}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span>{callUs.number || contact.phone || settings.phone || t('phone_not_set')}</span></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{footer.text || `© ${new Date().getFullYear()} ${settings.restaurantName || 'Restaurant'}.`}</div>
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col gap-3">
                  <h4 className="font-semibold mb-1">Follow</h4>
                  <div className="flex gap-2">
                    <a aria-label="instagram" href={`https://instagram.com/${settings.restaurantName?.replace(/\s+/g, '') || 'restaurant'}`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm inline-flex items-center gap-2">
                      <Instagram className="w-4 h-4" /> Instagram
                    </a>
                   
                  </div>
                  <div className="mt-auto text-xs text-gray-500 dark:text-gray-400">Built with care • Fast support</div>
                </div>
              </div>
            </footer>
          ))}
        </div>
      </div>

      {/* Global Animations */}
      <style>{`
        @keyframes expandImage {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-expandImage {
          animation: expandImage 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

// Wrap with ErrorBoundary
export default function LandingPage() {
  return (
    <ErrorBoundary>
      <LandingPageContent />
    </ErrorBoundary>
  );
}