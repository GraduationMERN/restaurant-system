import React from "react";

// StatusTimeline: displays order status progression
// Props:
// - currentStatus: string
// - timeline: array of statuses in order (optional)
// - timestamps: object mapping status -> ISO date (optional)

export default function StatusTimeline({ currentStatus = "pending", timeline = ["pending","confirmed","preparing","ready","served"], timestamps = {} }) {
  const currentIndex = Math.max(0, timeline.indexOf(currentStatus));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        {timeline.map((step, index) => {
          const done = index <= currentIndex;
          const active = index === currentIndex;
          return (
            <div key={step} className="flex-1 flex flex-col items-center text-center px-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${done ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <span className="text-xs font-semibold">{index+1}</span>
              </div>
              <div className={`text-sm ${active ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}`}>{step}</div>
              {timestamps[step] && (
                <div className="text-xs text-gray-400 mt-1">{new Date(timestamps[step]).toLocaleTimeString()}</div>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-1 bg-gray-200 relative">
        <div className="absolute left-0 top-0 h-1 bg-orange-500" style={{ width: `${(currentIndex/(timeline.length-1))*100}%` }} />
      </div>
    </div>
  );
}
