import React, { useState } from 'react'

export default function ConfirmPopup() {
    const [showConfirm, setShowConfirm] = useState(false);
  return (
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
                  dispatch(redeemReward(selectedReward._id));
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
  )
}
