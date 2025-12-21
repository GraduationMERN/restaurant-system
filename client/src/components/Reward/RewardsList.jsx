import React from 'react'
import { FaStarOfLife } from 'react-icons/fa';
import CardComponent from '../Card/CardComponent';
import { GiftIcon } from 'lucide-react';

export default function RewardsList({rewards,groupedRewards, setSelectedReward,setShowConfirm, canRedeem}) {
    return (
        <div className="px-6 mt-60 mb-20 md:mb-10 ">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Available Rewards</h2>

            {rewards.length === 0 ? (
                <p className="text-gray-500 text-center mt-10 dark:text-gray-200">No rewards found.</p>
            ) : (
                Object.entries(groupedRewards).map(([pointsRequired, items]) => (
                    <div key={pointsRequired} className="mb-10">

                        {/* Title */}
                        <h2 className="text-xl h-5 font-bold text-secondary mb-4 flex items-center gap-2">
                            {pointsRequired}
                            <GiftIcon className="h-5" />
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
                            {items.map((item) => {
                                const product = item.productId;
                                return (
                                    <CardComponent
                                        onClick={() => {
                                            if (!canRedeem(item.pointsRequired)) return;
                                            setSelectedReward(item);
                                            setShowConfirm(true)
                                        }}
                                        item={item}
                                        product={product}
                                        key={item._id}
                                        canRedeem={canRedeem}
                                        isReward={true}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ))

            )}

        </div>
    )
}
