import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getAllRewards, redeemReward, getUserRedemptions } from '../redux/slices/rewardSlice';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { notifyRedeemed } from '../utils/notifications';
import Confirmation from '../components/Reward/Confirmation';
import Redemptions from '../components/Reward/Redemptions';
import MileStones from '../components/Reward/MileStones';
import RewardsList from '../components/Reward/RewardsList';
import NotifyToLogin from '../components/Reward/LoginFirst';

export default function RewardPage() {

  const dispatch = useDispatch();
  const { reward } = useSelector((state) => state.reward || {});
  const { user} = useSelector((state) => state.auth);
  const userRedemptions = useSelector((state) => state.reward?.userRedemptions || []);
  const toast = useToast();
  const navigate = useNavigate();
  const points = user?.points || 0;
  const [userPoints, setUserPoints] = useState(points);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedemptions, setShowRedemptions] = useState(false);
  const [notifyLogin, setNotifyLogin] = useState(!user);
  const userName = user?.name || "Guest";
  useEffect(() => {
    dispatch(getAllRewards());
  }, [dispatch]);

  useEffect(() => {
    setUserPoints(points);
  }, [points]);

   useEffect(() => {
    document.body.classList.add('custom-scrollbar-page');
    return () => {
      document.body.classList.remove('custom-scrollbar-page');
    };
  }, []);

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
      
      // Show browser notification on successful redemption
      notifyRedeemed(item);

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
      <MileStones milestones={milestones} points={points} userName={userName} maxMilestone={maxMilestone} userPoints={userPoints} handleViewRedemptions={handleViewRedemptions} progress={progress} />
      {/* REWARDS LIST */}
      <RewardsList rewards={rewards} groupedRewards={groupedRewards} setSelectedReward={setSelectedReward} setShowConfirm={setShowConfirm} canRedeem={canRedeem}/>
      {showConfirm && (
        <Confirmation selectedReward = {selectedReward} onClick={() => {handleRedeem(selectedReward); setShowConfirm(false)}} onReject={() => setShowConfirm(false)}/>
      )}
      {notifyLogin && (
      <NotifyToLogin  onClick={() => setShowRedemptions(false)} onLeter={()=>{setNotifyLogin(false)}}/>
    )}
      {/* REDEMPTIONS HISTORY MODAL */}
      {showRedemptions && (
        <Redemptions  userRedemptions = {userRedemptions} onClick={() => setShowRedemptions(false)} viewDetails={(redemption) => navigate(`/reward-order/${redemption._id}`, { state: { order: redemption } })}/>
      )}
    </>
  );
}
