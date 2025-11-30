import React, { useState, useEffect } from 'react';
import { Star, Gift } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { getAllRewards, redeemReward } from '../redux/slices/rewardSlice';
import { useToast } from '../hooks/useToast';
import { FaStarOfLife } from "react-icons/fa";

export default function RewardPage() {
  const dispatch = useDispatch();
  const { reward, loading, error } = useSelector((state) => state.reward || {});
  const toast = useToast();

  const [points] = useState(2100);

  useEffect(() => {
    dispatch(getAllRewards());
  }, [dispatch]);

  const rewards = reward || [];

  // ---- MILESTONE LOGIC ----
  const milestones = [...new Set(rewards.map(r => r.pointsRequired))].sort((a, b) => a - b);

  const maxMilestone = milestones[milestones.length - 1] || 1;
  const progress = Math.min((points / maxMilestone) * 100, 100);

  const canRedeem = (required) => points >= required;

  return (
    <div className="md:mx-20 min-h-screen bg-white pb-10">

      {/* HEADER */}
      <div className=" py-8 px-6 rounded-b-3xl shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Rewards</h1>

        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">

          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">Your Points</span>
            
          </div>

          <p className="text-4xl font-bold">{points}</p>

          {/* MILESTONE PROGRESS BAR */}
          <div className="relative mt-6">
            {/* Base line */}
            <div className="w-full bg-gray-200/90 rounded-full h-3 overflow-hidden">
              <div
                className="bg-secondary-200 h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Milestones */}
            <div className="relative w-full">
              {milestones.map((m, i) => {
                const leftPos = (m / maxMilestone) * 100;

                return (
                  <div
                    key={i}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${leftPos}%`, transform: "translateX(-50%)" }}
                  >
                    {/* Star */}
                    <FaStarOfLife
                      className={`relative -top-5 w-7 h-7 font-bold ${points >= m ? "text-secondary" : "text-default"}`}
                    />

                    {/* Text */}
                    <span className="text-xs text-white mt-1">
                      {m}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* REWARDS LIST */}
      <div className="px-6 mt-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Available Rewards</h2>

        {rewards.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">No rewards found.</p>
        ) : (
          <div className=" grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-4">

            {rewards.map((item) => {
              const product = item.productId;

              return (
                <div
                  key={item._id}
                  className={` ${canRedeem(item.pointsRequired)?"opacity-100":"opacity-50"} rounded-2xl shadow-md border border-secondary h-30 lg:h-80 bg-white flex items-center justify-between lg:flex-col hover:shadow-lg transition overflow-hidden`}
                >
                  <div className="flex lg:flex-col items-center gap-4">
                    {product?.imgURL ? (
                      <img
                        src={product.imgURL}
                        alt={product.name}
                        className="rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="object-cover bg-gray-100 rounded-xl flex items-center justify-center shadow-inner">
                        <Gift className="text-gray-400" />
                      </div>
                    )}
                  </div>
                 
                  <div className="flex flex-col">
                    <h3 className="mx-2 text-md font-semibold text-secondary">{item.pointsRequired}</h3>
                    <div className='grid grid-cols-5'>
                      <h3 className={`mx-2 text-sm font-semibold col-span-4  ${canRedeem(item.pointsRequired)?"text-on-surface" : "text-muted"}`}>{product?.name || "Reward"}</h3>
                    <button
                      disabled={!canRedeem(item.pointsRequired)}
                          onClick={async () => {
                        if (!canRedeem(item.pointsRequired)) return;
                        try {
                          const r = await dispatch(redeemReward({ rewardId: item._id })).unwrap();
                          toast.showToast({ message: 'Redeemed successfully', type: 'success' });
                          console.log('Redeem result', r);
                        } catch (err) {
                          toast.showToast({ message: 'Redeem failed: ' + (err?.message || err || 'unknown'), type: 'error' });
                          console.error('Redeem failed', err);
                        }
                      }}
                      className={`px-4 py-2 rounded-tl-xl font-semibold shadow-sm transition-all duration-300 hover:bg-secondary-200 ${canRedeem(item.pointsRequired)
                          ? "bg-secondary text-white "
                          : "bg-gray-200 text-gray-400 cursor-not-allowed"
                        }`}
                    >
                      +
                    </button>
                    </div>
                  </div>
                </div>

              );
            })}

          </div>
        )}

      </div>
    </div>
  );
}
