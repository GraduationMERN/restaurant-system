import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getAllRewards, redeemReward, getUserRedemptions } from '../redux/slices/rewardSlice';
import { getMe } from '../redux/slices/authSlice'
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import { notifyRedeemed } from '../utils/notifications';
import Confirmation from '../components/Reward/Confirmation';
import Redemptions from '../components/Reward/Redemptions';
import MileStones from '../components/Reward/MileStones';
import RewardsList from '../components/Reward/RewardsList';
import NotifyToLogin from '../components/Reward/LoginFirst';
import PageMeta from '../components/common/PageMeta';
import { useTranslation } from 'react-i18next';

export default function RewardPage() {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const { reward } = useSelector((state) => state.reward || {});
  const { user } = useSelector((state) => state.auth);
  const userRedemptions = useSelector((state) => state.reward?.userRedemptions || []);
  const toast = useToast();
  const navigate = useNavigate();
  const points = user?.points || 0;
  const [userPoints, setUserPoints] = useState(points);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showRedemptions, setShowRedemptions] = useState(false);
  const [notifyLogin, setNotifyLogin] = useState(!user);
  const [languageKey, setLanguageKey] = useState(i18n.language);
  const userName = user?.name || "Guest";

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setLanguageKey(lng);
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  useEffect(() => {
    setUserPoints(points);
  }, [points]);

  useEffect(() => {
    dispatch(getAllRewards());
  }, [dispatch]);

  useEffect(() => {
    document.body.classList.add('custom-scrollbar-page');
    return () => {
      document.body.classList.remove('custom-scrollbar-page');
    };
  }, []);

  useEffect(() => {
    setNotifyLogin(!user);
  }, [user]);

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
      toast.showToast({ message: 'Redeemed successfully', type: 'success' });

      notifyRedeemed(item);
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Background decorative circles */}
      <PageMeta title="Rewards" description="Exclusive rewards and offers" />

      {/* Content */}
      <div className="relative z-10">
        {/* HEADER */}
        <MileStones key={points} milestones={milestones} points={points} userName={userName} maxMilestone={maxMilestone} userPoints={userPoints} handleViewRedemptions={handleViewRedemptions} progress={progress} />
        {/* REWARDS LIST */}
        <RewardsList rewards={rewards} groupedRewards={groupedRewards} setSelectedReward={setSelectedReward} setShowConfirm={setShowConfirm} canRedeem={canRedeem} />
      </div>

      {showConfirm && (
        <Confirmation selectedReward={selectedReward} onClick={() => { handleRedeem(selectedReward); setShowConfirm(false) }} onReject={() => setShowConfirm(false)} />
      )}
      {notifyLogin && (
        <NotifyToLogin onClick={() => setShowRedemptions(false)} onLeter={() => { setNotifyLogin(false) }} />
      )}
      {/* REDEMPTIONS HISTORY MODAL */}
      {showRedemptions && (
        <Redemptions userRedemptions={userRedemptions} onClick={() => setShowRedemptions(false)} viewDetails={(redemption) => navigate(`/reward-order/${redemption._id}`, { state: { order: redemption } })} />
      )}
    </div>
  );
}
