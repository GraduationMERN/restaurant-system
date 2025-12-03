import React, { useState, useEffect } from 'react';
import { Star, Gift } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { getAllRewards, redeemReward } from '../redux/slices/rewardSlice';
import { useToast } from '../hooks/useToast';
import { FaStarOfLife } from "react-icons/fa";
import CardComponent from '../components/Card/CardComponent';

export default function RewardPage() {
  const dispatch = useDispatch();
  const { reward } = useSelector((state) => state.reward || {});
  const { user, isAuthenticated, loadingGetMe } = useSelector((state) => state.auth);

  const toast = useToast();

  const points = user?.points || 0;
  const [userPoints, setUserPoints] = useState(points);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  const userName = user?.name || "Guest";
  useEffect(() => {
    dispatch(getAllRewards());
  }, [dispatch]);

  useEffect(() => {
    setUserPoints(points);
  }, [points]);
  const rewards = reward || [];

  // ---- MILESTONE LOGIC ----
  const milestones = [...new Set(rewards.map(r => r.pointsRequired))].sort((a, b) => a - b);

  const maxMilestone = milestones[milestones.length - 1] || 1;
  const progress = Math.min((points / maxMilestone) * 100, 100);
  const sortedRewards = [...rewards].sort((a, b) => a.pointsRequired - b.pointsRequired);

  const groupedRewards = sortedRewards.reduce((acc, item) => {
    if (!acc[item.pointsRequired]) acc[item.pointsRequired] = [];
    acc[item.pointsRequired].push(item);
    return acc;
  }, {});
  const canRedeem = (required) => points >= required;

  const handleRedeem = async (item) => {
    if (!canRedeem(item.pointsRequired)) return;
    try {
      const r = await dispatch(redeemReward({ rewardId: item._id })).unwrap();
      setUserPoints(prev => prev - item.pointsRequired);
      toast.showToast({ message: 'Redeemed successfully', type: 'success' });
    } catch (err) {
      toast.showToast({ message: 'Redeem failed: ' + (err?.message || err || 'unknown'), type: 'error' });
    }
  };
  return (
    <>

      {/* HEADER */}
      <div className="fixed z-10  top-0 w-full md:w-9/10 dark:bg-gray-800 bg-white py-8 px-6 rounded-b-3xl shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Rewards</h1>

        <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">

          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">Hello, {userName}</span>
          </div>

          <p className="text-4xl font-bold">{userPoints}</p>

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
      <div className="px-6 mt-80 mb-20 md:mb-10 ">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Available Rewards</h2>

        {rewards.length === 0 ? (
          <p className="text-gray-500 text-center mt-10 dark:text-gray-200">No rewards found.</p>
        ) : (
          Object.entries(groupedRewards).map(([pointsRequired, items]) => (
              <div key={pointsRequired} className="mb-10">

                {/* Title */}
                <h2 className="text-xl font-bold text-secondary mb-4 flex items-center gap-2">
                  {pointsRequired}
                  <FaStarOfLife className="text-secondary" />
                </h2>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6">
                  {items.map((item) => {
                    const product = item.productId;
                    return (
                     <CardComponent onClick={()=>{setSelectedReward(item); setShowConfirm(true)}}
                      item={item} product={product}  key={item._id} canRedeem={canRedeem} isReward={true} />
                    );
                  })}
                </div>
              </div>
            ))
          
        )}

      </div>
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-sm text-center animate-fadeIn">
            <h2 className="text-xl font-semibold mb-4">Confirm Redemption</h2>
            <p className="text-gray-600 mb-6">
              Redeem <span className="font-bold">{selectedReward.title}</span> for{" "}
              <span className="font-bold">{selectedReward.pointsRequired}</span> points?
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  handleRedeem(selectedReward);
                  setShowConfirm(false);
                }}
                className="px-4 py-2 bg-secondary text-white rounded-xl"
              >
                Yes, Redeem
              </button>

              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </>


  );
}
