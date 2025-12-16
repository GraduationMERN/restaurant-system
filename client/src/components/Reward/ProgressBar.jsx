import { t } from 'i18next';
import React, { useEffect, useState } from 'react'
import { FaStarOfLife } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

export default function ProgressBar({ Reward }) {
    const navigate = useNavigate()
    const { user } = useSelector((state) => state.auth);
    const { reward } = useSelector((state) => state.reward || {});

    const points = user?.points || 0;
    const [userPoints, setUserPoints] = useState(points);

    useEffect(() => {
        setUserPoints(points);
    }, [points]);

    const rewards = reward || [];
    const milestones = [...new Set(rewards.map(r => r.pointsRequired))].sort((a, b) => a - b);
    const maxMilestone = milestones[milestones.length - 1] || 1;
    const progress = Math.min((points / maxMilestone) * 100, 100);
    return (
        <div className="relative mt-6">
            {!user & !Reward && (
                <div className="absolute inset-0 p-12 -top-7 -right-6 z-20 flex items-center justify-center bg-white/10 dark:bg-gray-900/10 backdrop-blur-xs rounded-lg">
                    <p className="font-semibold text-center  md:text-xl text-secondary cursor-pointer " onClick={() => navigate("/login")}>
                            {t("Login_Reward")}
                    </p>
                </div>
            )}
            {/* Base line */}
            <div className="w-full bg-gray-200/90 rounded-full h-3 overflow-hidden">
                <div
                    className="bg-secondary/90 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                />
            </div>
            {/* Milestone markers */}
            <div className="relative w-full">
                {milestones.map((m, i) => {
                    const leftPos = (m / maxMilestone) * 100;
                    return (
                        <div>
                            <div
                                key={i}
                                className="absolute top-0 flex flex-col items-center"
                                style={{ left: `${leftPos}%`, transform: "translateX(-50%)" }}
                            >
                                <FaStarOfLife
                                    className={`relative -top-5 w-7 h-7 font-bold ${points >= m ? "text-secondary" : "text-secondary/60"}`}
                                />
                                    <span className={`text-xs text-secondary`}>
                                        {m}
                                    </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
