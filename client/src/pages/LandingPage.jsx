import React, { useEffect, useState } from "react";
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

export default function LandingPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedImage, setExpandedImage] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // SVG pattern as a constant to avoid syntax issues
  const svgPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

  // Instagram Posts Data
  const instagramPosts = [
    {
      image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=600&h=600&fit=crop",
      likes: "2.4k",
      caption: "Fresh morning breakfast made with organic ingredients",
      comments: "128",
      date: "2 days ago",
      tags: ["breakfast", "organic", "fresh"]
    },
    {
      image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=600&fit=crop",
      likes: "3.1k",
      caption: "Chef's special pasta - a customer favorite for 3 years running",
      comments: "245",
      date: "4 days ago",
      tags: ["pasta", "chefspecial", "favorite"]
    },
    {
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=600&fit=crop",
      likes: "4.2k",
      caption: "Family dinner night - creating memories around great food",
      comments: "189",
      date: "1 week ago",
      tags: ["familydinner", "memories", "tradition"]
    },
    {
      image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=600&fit=crop",
      likes: "1.8k",
      caption: "Homemade desserts that will satisfy your sweet tooth",
      comments: "92",
      date: "2 weeks ago",
      tags: ["desserts", "homemade", "sweet"]
    },
    {
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop",
      likes: "3.5k",
      caption: "Healthy salad bowls for those mindful eating days",
      comments: "156",
      date: "3 weeks ago",
      tags: ["salad", "healthy", "mindfuleating"]
    },
    {
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=600&fit=crop",
      likes: "5.1k",
      caption: "Our signature pizza - voted best in the city 2023",
      comments: "312",
      date: "1 month ago",
      tags: ["pizza", "signature", "awardwinning"]
    },
    {
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop",
      likes: "1.2k",
      caption: "Hand-tossed crusts baked to perfection",
      comments: "54",
      date: "3 days ago",
      tags: ["pizza", "crust", "baked"]
    },
    {
      image: "https://www.pinterest.com/pin/609252655860460716/",
      likes: "900",
      caption: "Fresh ingredients, fresh taste",
      comments: "38",
      date: "5 days ago",
      tags: ["fresh", "ingredients", "salad"]
    },
  ];

  // Action cards with food images instead of icons
  const actionCards = [
    {
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop",
      title: t("browse_menu"),
      description: t("explore_dishes"),
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900",
      imageBg: "bg-amber-100 dark:bg-amber-900/30",
      navigate: "/menu",
    },
    {
  image: "https://media.istockphoto.com/id/1212695280/photo/cat-in-hat-driving-red-car.jpg?s=612x612&w=0&k=20&c=dhm3Sex1GShH0N7hScAgRuEGZz3r_6tL3rz3YWtPoOo=",
      title: t("track_order"),
      description: t("check_status"),
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900",
      imageBg: "bg-blue-100 dark:bg-blue-900/30",
      navigate: "/orders",
    },
    {
      image: "https://plus.unsplash.com/premium_photo-1682310144714-cb77b1e6d64a?w=600&h=600&fit=crop",
      title: t("reviews"),
      description: t("explore_reviews"),
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900",
      imageBg: "bg-purple-100 dark:bg-purple-900/30",
      navigate: "/reviews",
    },
    {
      image: "https://media.istockphoto.com/id/1251768924/photo/pink-piggy-bank-with-life-belt.jpg?s=612x612&w=0&k=20&c=vFf4ClK44lfGsMWfQTowqIScnSfZPuAJquARuFhcfRg=",
      title: t("Support"),
      description: t("FAQ_and_help"),
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900",
      imageBg: "bg-emerald-100 dark:bg-emerald-900/30",
      navigate: "/support",
    },
  ];

  const handleImageExpand = (index) => {
    setActiveImageIndex(index);
    setExpandedImage(instagramPosts[index]);
    document.body.style.overflow = 'hidden';
  };

  const handleImageClose = () => {
    setExpandedImage(null);
    document.body.style.overflow = 'auto';
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % instagramPosts.length);
    setExpandedImage(instagramPosts[(activeImageIndex + 1) % instagramPosts.length]);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + instagramPosts.length) % instagramPosts.length);
    setExpandedImage(instagramPosts[(activeImageIndex - 1 + instagramPosts.length) % instagramPosts.length]);
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

  return (
    <div
      className={`min-h-screen bg-white dark:bg-gray-900 transition-all duration-1000 ${
        isRTL ? "rtl" : "ltr"
      }`}
    >
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
          {/* Backdrop with blur */}
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
                <img
                  src={instagramPosts[activeImageIndex].image}
                    alt="Expanded post"
                    className="w-full h-[40vh] md:h-[50vh] object-cover"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 md:p-8">
                  <div className="text-white">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Heart className="w-5 h-5 fill-current" />
                        <span className="text-lg font-semibold">{instagramPosts[activeImageIndex].likes}</span>
                      </div>
                      <div className="flex-1" />
                      <span className="text-sm opacity-90">{instagramPosts[activeImageIndex].date}</span>
                    </div>
                    <p className="text-base md:text-lg mb-3">{instagramPosts[activeImageIndex].caption}</p>
                    <div className="flex flex-wrap gap-2">
                      {instagramPosts[activeImageIndex].tags.map((tag, i) => (
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

      <div className="relative z-10 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="max-w-6xl w-full">
          {/* Logo and Header with Animation */}
          <div
            className={`text-center mb-12 md:mb-16 transition-all duration-1000 ${
              isLoaded
                ? "translate-y-0 opacity-100"
                : "translate-y-10 opacity-0"
            }`}
          >
            <div className="relative w-40 h-40 mx-auto mb-8">
              {/* Decorative circle */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-20 animate-pulse-slow" />
              <div className="absolute inset-4 rounded-full border-4 border-white/50 dark:border-gray-700/50" />
              <div className="absolute inset-8 rounded-full overflow-hidden shadow-2xl ring-4 ring-white dark:ring-gray-800 transition-transform duration-500 group-hover:scale-105">
                <img
                  src={
                    settings.branding?.logoUrl ||
                    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop&crop=face"
                  }
                  alt={t("welcome")}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-amber-500 animate-spin-slow" />
            </div>

            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent dark:from-amber-400 dark:via-orange-400 dark:to-amber-300 mb-4 font-serif tracking-tight">
              {settings.restaurantName || t("welcome")}
            </h1>

            <p className="text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
              {settings.description}
            </p>

            {/* Decorative separator */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-amber-300 dark:to-amber-600" />
              <ChefHat className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-amber-300 dark:to-amber-600" />
            </div>
          </div>

          {/* Action Cards Grid with Staggered Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {actionCards.map((card, index) => (
              <button
                key={index}
                onClick={() => navigate(card.navigate)}
                className={`${card.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/50 dark:border-gray-700/50 group text-left backdrop-blur-sm hover:-translate-y-2 active:scale-[0.98] overflow-hidden ${
                  isRTL ? "text-right" : ""
                } ${isLoaded ? `animate-slide-up` : "opacity-0"}`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div
                  className={`flex items-start justify-between mb-5 ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <div className={`w-14 h-14 ${card.imageBg} rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md relative`}>
                    {/* Image overlay for better icon visibility */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent z-10" />
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <ArrowRight
                    className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                      isRTL
                        ? "rotate-180 group-hover:-translate-x-1"
                        : "group-hover:translate-x-1"
                    }`}
                  />
                </div>
                <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-2`}>
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {card.description}
                </p>
              </button>
            ))}
          </div>

          {/* Special Offer Card with Enhanced Design */}
          <div
            className={`relative overflow-hidden rounded-3xl mb-12 transition-all duration-700 ${
              isLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500" />
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: svgPattern }}
            />

            <div className="relative p-8 md:p-12 text-white">
              <div
                className={`flex flex-col md:flex-row items-center justify-between gap-8 mb-8 ${
                  isRTL ? "md:flex-row-reverse" : ""
                }`}
              >
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
                      Join 500+ Happy Customers
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/register")}
                className="w-full md:w-auto bg-white text-amber-700 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 active:scale-[0.98] transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl text-lg group flex items-center justify-center gap-3"
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

          {/* Instagram Feed/Recent Posts Section */}
          <div
            className={`mb-12 transition-all duration-700 ${
              isLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 mb-6">
                <Instagram className="w-8 h-8 text-pink-600 dark:text-pink-500" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Follow Us
                </h2>
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Tag us <span className="font-bold text-amber-600 dark:text-amber-500">@{settings.restaurantName?.replace(/\s+/g, '') || "ourrestaurant"}</span> to be featured!
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {instagramPosts.map((post, i) => (
                <div 
                  key={i} 
                  className="relative group overflow-hidden rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 aspect-square"
                  onClick={() => handleImageExpand(i)}
                >
                  <img 
                    src={post.image} 
                    alt={`Instagram post ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="text-white w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 fill-current" />
                          <span className="font-semibold text-sm">{post.likes}</span>
                        </div>
                        <span className="text-xs opacity-90">#{post.tags[0]}</span>
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
                className="inline-flex items-center gap-3 bg-primary text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Instagram className="w-5 h-5" />
                Follow on Instagram
              </a>
            </div>
          </div>

          {/* Contact Information with Improved Layout */}
          <div
            className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50 dark:border-gray-700/50 transition-all duration-700 ${
              isLoaded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {[
                {
                  icon: MapPin,
                  title: t("location"),
                  content: settings.address,
                  color: "text-green-600 dark:text-green-400",
                  bgColor: "bg-green-100 dark:bg-green-900/20",
                },
                {
                  icon: Phone,
                  title: t("call_us"),
                  content: settings.phone,
                  color: "text-purple-600 dark:text-purple-400",
                  bgColor: "bg-purple-100 dark:bg-purple-900/20",
                },
                {
                  icon: Clock,
                  title: t("opening_hours") || "Opening Hours",
                  content: "Mon-Fri: 11AM-10PM\nSat-Sun: 10AM-11PM",
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

            {/* Location Map with Enhanced Styling */}
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 p-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  {t("find_us") || "Find Our Location"}
                </h3>
              </div>
              <LocationMap />
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-12 text-gray-600 dark:text-gray-400">
            <p className="text-sm">
              {t("open_hours") || "Open daily from 8:00 AM to 11:00 PM"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              © {new Date().getFullYear()} {settings.restaurantName || "Restaurant"}. All rights reserved.
            </p>
          </div>
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