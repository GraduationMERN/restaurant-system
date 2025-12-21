import { t } from 'i18next';
import React, { useEffect, useRef, useState } from 'react'
import { TbGiftFilled } from "react-icons/tb";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { gsap } from 'gsap';

export default function ProgressBar({ Reward }) {
    const navigate = useNavigate()
    const { user } = useSelector((state) => state.auth);
    const { reward } = useSelector((state) => state.reward || {});

    const points = user?.points || 0;
    const progressBarRef = useRef(null);
    const milestoneRefs = useRef([]);
    const [celebratedMilestones, setCelebratedMilestones] = useState(new Set());

    const rewards = reward || [];
    const milestones = [...new Set(rewards.map(r => r.pointsRequired))].sort((a, b) => a - b);
    const maxMilestone = milestones[milestones.length - 1] || 1;
    const targetProgress = Math.min((points / maxMilestone) * 100, 100);

    // Animate progress bar with GSAP
    useEffect(() => {
        if (progressBarRef.current) {
            gsap.to(progressBarRef.current, {
                width: `${targetProgress}%`,
                duration: 2,
                ease: "power2.out"
            });
        }
    }, [targetProgress]);

    // Check for new milestone achievements and animate
    useEffect(() => {
        const newMilestones = milestones.filter(m => points >= m && !celebratedMilestones.has(m));

        newMilestones.forEach((milestone, index) => {
            const milestoneIndex = milestones.indexOf(milestone);
            const milestoneElement = milestoneRefs.current[milestoneIndex];

            if (milestoneElement) {
                // Animate the milestone achievement
                const tl = gsap.timeline();

                // Bounce animation for the gift icon
                tl.to(milestoneElement.querySelector('.gift-icon'), {
                    scale: 1.5,
                    duration: 0.3,
                    ease: "back.out(1.7)",
                    yoyo: true,
                    repeat: 1
                })
                // Pulse effect
                .to(milestoneElement.querySelector('.gift-icon'), {
                    scale: 1.2,
                    duration: 0.2,
                    ease: "power2.inOut",
                    yoyo: true,
                    repeat: 3
                }, "-=0.5")
                // Color transition
                .to(milestoneElement.querySelector('.milestone-text'), {
                    color: 'var(--color-secondary)', // secondary color
                    fontWeight: 600,
                    duration: 0.5
                }, "-=1");

                // Add ping effect
                const pingElement = milestoneElement.querySelector('.ping-effect');
                if (pingElement) {
                    gsap.fromTo(pingElement,
                        { scale: 0, opacity: 1 },
                        { scale: 3, opacity: 0, duration: 1, ease: "power2.out" }
                    );
                }
            }
        });

        if (newMilestones.length > 0) {
            setCelebratedMilestones(prev => new Set([...prev, ...newMilestones]));
        }
    }, [points, milestones, celebratedMilestones]);

    return (
        <div className="relative mt-6">
            {!user && !Reward && (
                <div className="absolute inset-0 p-12 -top-7 -right-6 z-20 flex items-center justify-center bg-white/10 dark:bg-gray-900/10 backdrop-blur-xs rounded-lg">
                    <p className="font-semibold text-center text-xs sm:text-xl text-secondary cursor-pointer " onClick={() => navigate("/login")}>
                            {t("Login_Reward")}
                    </p>
                </div>
            )}
            {/* Base line */}
            <div className="w-full bg-gray-200/90 rounded-full h-2 md:h-3 overflow-hidden relative">
                <div
                    ref={progressBarRef}
                    className="bg-gradient-to-r from-secondary/50 via-secondary to-secondary h-full rounded-full relative"
                    style={{ width: '0%' }}
                >
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
            </div>
            {/* Milestone markers */}
            <div className="relative w-full ">
                {milestones.map((m, i) => {
                    const leftPos = (m / maxMilestone) * 100;
                    const isAchieved = points >= m;
                    return (
                        <div
                            key={i}
                            ref={el => milestoneRefs.current[i] = el}
                            className="absolute flex flex-col items-center"
                            style={{ left: `${leftPos}%`, transform: "translateX(-50%)" }}
                        >
                            <div className="relative">
                                <TbGiftFilled
                                    className={`gift-icon  relative font-bold transition-all duration-500  w-6 h-6 md:-top-6 md:w-7 md:h-7 ${
                                        isAchieved ? "text-secondary brightness-120 drop-shadow-lg -top-5 " : " -top-4 text-secondary/90"
                                    }`}
                                />
                                {isAchieved && (
                                    <div className="ping-effect absolute h-8 w-8 -top-8 bg-secondary/20 rounded-full"></div>
                                )}
                            </div>
                            <span className={`milestone-text text-xs -mt-3 transition-all duration-500 ${
                                isAchieved ? "text-secondary font-semibold" : "text-secondary/80"
                            }`}>
                                {m}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
