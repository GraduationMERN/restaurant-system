import { t } from 'i18next';
import ProgressBar from './ProgressBar';

export default function MileStones({userName, userPoints, handleViewRedemptions}) {
  return (
     <div className="fixed z-10 top-0 w-full md:w-9/10 dark:bg-gray-800 bg-white py-8 px-6 rounded-b-3xl shadow-lg">
            <div className="dark:bg-black/30 px-6 py-6 rounded-2xl backdrop-blur-md">
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">{t("Hello")}, <span className='text-secondary'>{userName}</span></span>
                <button
                  onClick={handleViewRedemptions}
                  className="text-xs px-5 py-2 hover:scale-105 transition-all bg-secondary/80  hover:bg-secondary text-white rounded-lg "
                >
                 {t('view_redemptions')}
                </button>
              </div>

              <p className="text-4xl font-bold text-secondary">{userPoints}</p>

              {/* MILESTONE PROGRESS BAR */}
              <ProgressBar Reward/>
            </div>
          </div>
  )
}
