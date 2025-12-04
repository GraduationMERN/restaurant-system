import React, { useState, useEffect } from 'react';
import { Star, Gift } from 'lucide-react';
import { useDispatch, useSelector } from "react-redux";
import { getAllRewards, redeemReward, getUserRedemptions } from '../redux/slices/rewardSlice';
import { useToast } from '../hooks/useToast';
import { FaStarOfLife } from "react-icons/fa";
import CardComponent from '../components/Card/CardComponent';
import { useNavigate } from 'react-router-dom';

export default function RewardPage() {
  const dispatch = useDispatch();
  const { reward } = useSelector((state) => state.reward || {});
  const { user, isAuthenticated, loadingGetMe } = useSelector((state) => state.auth);
  const userRedemptions = useSelector((state) => state.reward?.userRedemptions || []);

  const toast = useToast();
  const navigate = useNavigate();

  const points = user?.points || 0;
  const [userPoints, setUserPoints] = useState(points);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedemptions, setShowRedemptions] = useState(false);

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
      // If server returned the created reward order, navigate to tracking page
      if (r && (r._id || r.id)) {
        const orderId = r._id || r.id;
        navigate(`/reward-order/${orderId}`, { state: { order: r } });
        return;
      }
    } catch (err) {
      toast.showToast({ message: 'Redeem failed: ' + (err?.message || err || 'unknown'), type: 'error' });
    }
  };

  const handleViewRedemptions = async () => {
    try {
      await dispatch(getUserRedemptions()).unwrap();
      setShowRedemptions(true);
    } catch (err) {
      toast.showToast({ message: 'Failed to load redemptions: ' + (err?.message || err || 'unknown'), type: 'error' });
    }
  };
  return (
    <>

      {/* HEADER */}
      <div className="fixed z-10  top-0 w-full md:w-9/10 dark:bg-primary/30 bg-white py-8 px-6 rounded-b-3xl shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Rewards</h1>

        <div className="bg-white/20 dark:bg-primary/50 p-4 rounded-2xl backdrop-blur-md">

          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">Hello, {userName}</span>
            <button
              onClick={handleViewRedemptions}
              className="text-xs px-3 py-1 bg-secondary/80 hover:bg-secondary text-white rounded-lg transition-colors"
            >
              My Redemptions
            </button>
          </div>

          <p className="text-4xl font-bold">{userPoints}</p>

          {/* MILESTONE PROGRESS BAR */}
          <div className="relative mt-6">
            {/* Base line */}
            <div className="w-full bg-gray-200/90 rounded-full h-3 overflow-hidden">
              <div
                className="bg-secondary/90 h-full rounded-full transition-all duration-500"
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
                      className={`relative -top-5 w-7 h-7 font-bold ${points >= m ? "text-secondary" : "text-secondary/60"}`}
                    />

                    {/* Text */}
                    <span className="text-xs text-secondary bg:text-white mt-1">
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
                    <CardComponent onClick={() => {
                      if (!canRedeem(item.pointsRequired)) return;
                      setSelectedReward(item);
                      setShowConfirm(true)
                    }}
                      item={item} product={product} key={item._id} canRedeem={canRedeem} isReward={true} />
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

      {/* REDEMPTIONS HISTORY MODAL */}
      {showRedemptions && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-fadeIn">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Redemptions</h2>
              <button
                onClick={() => setShowRedemptions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Get from Redux store */}
              {userRedemptions?.length > 0 ? (
                <div className="space-y-4">
                  {userRedemptions.map((redemption) => (
                    <div key={redemption._id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {redemption.rewardId?.title || redemption.rewardId?.productId?.name || 'Reward'}
                          </h3>
                          <p className="text-sm text-gray-600">ID: {redemption._id}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          redemption.status === 'Ready' ? 'bg-green-100 text-green-700' :
                          redemption.status === 'Completed' ? 'bg-green-100 text-green-700' :
                          redemption.status === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {redemption.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Points Used</p>
                          <p className="font-semibold">{redemption.pointsUsed}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Redeemed Date</p>
                          <p className="font-semibold">{new Date(redemption.redeemedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {redemption.notes && (
                        <div className="mt-3 text-sm text-gray-600 border-t border-gray-200 pt-3">
                          <p><span className="font-medium">Notes:</span> {redemption.notes}</p>
                        </div>
                      )}
                      <button
                        onClick={() => navigate(`/reward-order/${redemption._id}`, { state: { order: redemption } })}
                        className="mt-3 text-sm text-secondary hover:underline font-medium"
                      >
                        View Details →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaStarOfLife className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No redemptions yet. Start redeeming rewards!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>


  );
}
