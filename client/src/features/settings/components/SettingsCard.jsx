// src/features/settings/components/SettingsCard.jsx
export default function SettingsCard({ 
  title, 
  description, 
  icon, 
  children,
  hasError = false 
}) {
  return (
    <div className={`rounded-xl border p-5 mb-6 ${
      hasError 
        ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' 
        : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50'
    }`}>
      <div className="flex items-start gap-3 mb-4">
        {icon && (
          <div className={`p-2 rounded-lg ${
            hasError 
              ? 'bg-red-100 dark:bg-red-900/20' 
              : 'bg-blue-100 dark:bg-blue-900/20'
          }`}>
            <span className="text-lg">{icon}</span>
          </div>
        )}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}