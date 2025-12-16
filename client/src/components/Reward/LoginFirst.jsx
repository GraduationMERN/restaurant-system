import { t } from 'i18next'
import { useNavigate } from 'react-router';


export default function NotifyToLogin({  onLeter }) {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-[90%] max-w-sm text-center animate-fadeIn">
                <h2 className="text-xl font-semibold mb-4">{t("Notify_login")}</h2>
                <p className="text-gray-600 mb-6">
                    {t("Login_msg")} <span className="font-bold"></span>
                    <span className="font-bold text-secondary">{t("Exclusive")}</span>
                </p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => {
                           navigate("/login")
                        }}
                        className="px-4 py-2 bg-secondary text-white rounded-xl"
                    >
                        {t("Login")}
                    </button>
                    <button
                    onClick={()=>{
                        onLeter()
                    }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-xl"
                    >
                        {t("Later")}
                    </button>
                </div>
            </div>
        </div>
    )
}
