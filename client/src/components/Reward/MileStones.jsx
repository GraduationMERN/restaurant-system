import { t } from 'i18next';
import ProgressBar from './ProgressBar';

export default function MileStones({userName, userPoints, handleViewRedemptions}) {
  return (
     <div className="fixed z-10 top-0 w-full md:w-9/10 dark:bg-gray-800 bg-white py-8 px-6 rounded-b-3xl shadow-lg">
            <h1 className="text-3xl font-bold mb-4"> {t('Rewards')}</h1>

            <div className="bg-white/20 dark:bg-gradient-to-r dark:from-secondary dark:to-secondary/70 p-4 rounded-2xl backdrop-blur-md">
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold">{t("Hello")}, <span className='text-secondary dark:text-white'>{userName}</span></span>
                <button
                  onClick={handleViewRedemptions}
                  className="text-xs px-5 py-2 bg-secondary/80  hover:bg-secondary text-white rounded-lg transition-colors"
                >
                 {t('view_redemptions')}
                </button>
              </div>

              <p className="text-4xl font-bold">{userPoints}</p>

              {/* MILESTONE PROGRESS BAR */}
              <ProgressBar Reward/>
            </div>
          </div>
  )
}
