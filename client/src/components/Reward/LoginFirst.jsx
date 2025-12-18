import { t } from 'i18next'
import { useNavigate } from 'react-router';
import { FaGift, FaStar, FaRocket } from 'react-icons/fa';
import { useEffect, useState } from 'react';

export default function NotifyToLogin({ onLeter }) {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 500);
    }, []);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-secondary/20 via-primary/10 to-secondary/20 backdrop-blur-md flex items-center justify-center z-50">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-secondary/30 rounded-full animate-bounce"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`
                        }}
                    />
                ))}
            </div>

            <div className={`bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-2xl w-[95%] max-w-md text-center relative overflow-hidden transform transition-all duration-700 ${
                isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
            }`}>
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-secondary/10 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-primary/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>

                {/* Animated icons */}
                <div className="relative mb-6">
                    <div className="flex justify-center items-center gap-4 mb-4">
                        <FaGift className="text-secondary text-3xl animate-bounce" />
                    
                        <FaRocket className="text-secondary text-3xl animate-pulse" />
                    </div>

                    {/* Floating stars */}
                    <div className="absolute inset-0 pointer-events-none">
                        <FaStar className="absolute top-2 left-8 text-yellow-400 text-lg animate-ping" style={{ animationDelay: '0.5s' }} />
                        <FaStar className="absolute top-4 right-6 text-yellow-400 text-sm animate-ping" style={{ animationDelay: '1s' }} />
                        <FaStar className="absolute bottom-2 left-12 text-yellow-400 text-base animate-ping" style={{ animationDelay: '1.5s' }} />
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-secondary to-secondary/90 bg-clip-text text-transparent animate-fade-in">
                    {t("Unlock Amazing Rewards!")}
                </h2>

                <div className="mb-6 space-y-3">
                    <p className="text-gray-600 dark:text-gray-300 text-lg font-medium animate-slide-up">
                        🎁 <span className="font-bold text-secondary">{t("Exclusive")}</span> {t("rewards waiting for you!")}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        {t("Earn points, redeem amazing prizes, and enjoy special offers!")}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm animate-slide-up" style={{ animationDelay: '0.4s' }}>
                        {t("Join thousands of happy customers already enjoying rewards!")}
                    </p>
                </div>

                {/* Benefits list with animations */}
                <div className="mb-6 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 animate-slide-up" style={{ animationDelay: '0.6s' }}>
                        <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                        <span>{t("Free rewards on every order")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 animate-slide-up" style={{ animationDelay: '0.8s' }}>
                        <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                        <span>{t("Exclusive member discounts")}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 animate-slide-up" style={{ animationDelay: '1s' }}>
                        <span className="w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
                        <span>{t("Birthday special surprises")}</span>
                    </div>
                </div>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate("/login")}
                        className="px-6 py-3 bg-gradient-to-r from-secondary to-secondary/90 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 animate-pulse-slow relative overflow-hidden group"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            <FaRocket className="text-sm" />
                            {t("Login & Start Earning!")}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                    <button
                        onClick={() => onLeter()}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-300 transform hover:scale-105"
                    >
                        {t("Maybe Later")}
                    </button>
                </div>

                {/* Encouraging footer */}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 animate-fade-in" style={{ animationDelay: '1.2s' }}>
                    ⏰ {t("Don't miss out on these amazing opportunities!")}
                </p>
            </div>
        </div>
    )
}
