import React from 'react'
import { FaStarOfLife } from 'react-icons/fa';

export default function MileStones({milestones, points, userName, userPoints, handleViewRedemptions,progress,maxMilestone}) {
  return (
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
  )
}
