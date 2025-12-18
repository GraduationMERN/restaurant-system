import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadUserAvatar } from "../../redux/slices/userProfileSlice";

export default function UserMetaCard() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.userProfile);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const displayAvatar = avatarPreview || profile?.avatarUrl || "/images/user/owner.jpg";
  const displayName = profile?.displayName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || "User";

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optimistic preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploading(true);

    try {
      const result = await dispatch(uploadUserAvatar(file)).unwrap();
      if (result?.avatarUrl) {
        setAvatarPreview(result.avatarUrl);
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
            <img src={displayAvatar} alt="user" className="w-full h-full object-cover" loading="lazy" />
          </div>
          <label className="hidden xl:block cursor-pointer text-xs px-3 py-2 rounded-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {uploading ? "Uploading..." : "Change Photo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
          <div className="order-3 xl:order-2">
            <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
              {displayName}
            </h4>
            <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile?.role || "user"}
              </p>
              <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {profile?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
