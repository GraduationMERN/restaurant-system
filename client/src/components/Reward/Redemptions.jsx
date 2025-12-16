import React from 'react'
import { FaStarOfLife } from 'react-icons/fa'

export default function Redemptions({userRedemptions, onClick, viewDetails}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="redemptions-modal bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto animate-fadeIn">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-semibold">My Redemptions</h2>
              <button
                // onClick={() => setShowRedemptions(false)}
                onClick ={onClick}
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
                    <div key={redemption._id} className=" border dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
                        onClick={()=>viewDetails(redemption)}
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
  )
}
