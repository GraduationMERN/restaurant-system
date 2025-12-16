import { t } from 'i18next';
import React, { useEffect, useState } from 'react'
import { FaStarOfLife } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

export default function ProgressBar({Reward}) {
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
            {!user & !Reward &&(
                <div className="inset-0 mb-3 flex items-center justify-center">
                    <p className=" font-semibold text-secondary"><span className='px-4 py-2 bg-secondary text-white rounded-xl lg:underline cursor-pointer' onClick={()=>navigate("/login")}>{t("Login")}</span> to UNLOCK  Rewards</p>
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
                        <div
                            key={i}
                            className="absolute top-0 flex flex-col items-center"
                            style={{ left: `${leftPos}%`, transform: "translateX(-50%)" }}
                        >
                            <FaStarOfLife
                                className={`relative -top-5 w-7 h-7 font-bold ${points >= m ? "text-secondary" : "text-secondary/60"}`}
                            />
                            {Reward &&
                            <span className="text-xs text-secondary bg:text-white mt-1">
                                {m}
                            </span>
                            }
                            
                        </div>
                    );
                })}
            </div>
        </div>
    )
}
