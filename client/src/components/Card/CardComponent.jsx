import { Gift } from 'lucide-react';
import React from 'react'
import { useState } from 'react';

export default function CardComponent({ item, product, isReward, disabled, onClick, canRedeem }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div
            onClick={onClick}
            onMouseEnter={()=>setHovered(true)}
            onMouseLeave={()=>setHovered(false)}
            className={`${!isReward ? "opacity-100" : canRedeem(item.pointsRequired) ? "opacity-100" : "opacity-70"}
             group cursor-pointer rounded-xl shadow-md lg:hover:translate-y-2
                    h-32 lg:h-80 bg-white dark:bg-gray-200 flex lg:flex lg:flex-col lg:justify-between
                    hover:shadow-lg transition duration-200 overflow-hidden`}
        >
            {isReward ? (
                <div className="w-1/2  lg:w-full lg:h-1/2 flex items-center gap-4">
                    {product?.imgURL ? (
                        <img
                            src={product.imgURL}
                            alt={product.name}
                            className="rounded-xl object-cover  shadow-sm"
                        />
                    ) : (
                        <div className="object-cover bg-gray-100 rounded-xl flex items-center justify-center shadow-inner">
                            <Gift className="text-gray-400" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="w-1/2 lg:w-full  lg:h-1/2 flex items-center gap-4">
                    <img
                        src={product.imgURL}
                        alt={product.name}
                        className=" max-h-full min-w-full rounded-xl object-cover shadow-sm"
                    />
                </div>
            )}


            {isReward ?
                <div className="flex  lg:flex-col justify-between w-1/2 lg:w-full lg:relative">
                    <h3 className="flex flex-col mx-2 justify-center text-md font-semibold text-secondary">
                        <span
                            className={`text-sm font-semibold flex-1 ${isReward && canRedeem(item.pointsRequired)
                                ? "text-on-surface"
                                : "text-muted"
                                }`}
                        >
                            {product?.name || "Reward"}
                            </span>
                            {item.pointsRequired}
                        
                    </h3>
                    <button
                        disabled={disabled}
                        className={` px-4 lg:py-2 lg:absolute lg:right-0 lg:bottom-0 rounded-tl-xl transition duration-200 ${hovered&&"bg-secondary/100"}  ${canRedeem(item.pointsRequired) ? "bg-secondary/80 text-white " : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                    >
                        <span className="text-2xl inline-block transform transition-transform duration-500 group-hover:rotate-225">
                            +
                        </span>
                    </button>
                </div>
                 :
                <div className='flex lg:flex-col  justify-between w-1/2 lg:w-full lg:relative'>
                    <h3 className="flex flex-col mx-2 justify-center text-md font-semibold text-primary">
                        <div
                            className={`text-sm font-semibold flex-1 `}
                        >

                            {product?.name || "Product"}

                        </div>
                        <span className='text-xs text-[#888]'>
                            {product.desc}
                        </span>
                        {product.basePrice} EGP
                    </h3>
                    <button
                        disabled={disabled}
                        className={` px-4 lg:py-2 lg:absolute lg:right-0 lg:bottom-0 rounded-tl-xl transition duration-200  ${hovered? "bg-primary/100" :""}   ${!isReward ? "bg-primary/80 text-white" : canRedeem(item.pointsRequired) ? "bg-secondary text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                    >
                        <span className="text-2xl inline-block transform transition-transform   duration-500 group-hover:rotate-225">
                            +
                        </span>
                    </button>

                </div>
            }
        </div>
    )
}
