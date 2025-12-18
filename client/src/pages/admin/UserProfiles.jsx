import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "../../redux/slices/userProfileSlice";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import UserMetaCard from "../../components/UserProfile/UserMetaCard";
import UserInfoCard from "../../components/UserProfile/UserInfoCard";
import UserAddressCard from "../../components/UserProfile/UserAddressCard";
import PageMeta from "../../components/common/PageMeta";

export default function UserProfiles() {
  const dispatch = useDispatch();
  const { loading, profile } = useSelector((state) => state.userProfile);

  // Fetch profile on mount
  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    <>
      <PageMeta
        title="Profile | Admin Dashboard"
        description="Manage your profile settings"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        {loading && !profile ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <UserMetaCard />
            <UserInfoCard />
            <UserAddressCard />
          </div>
        )}
      </div>
    </>
  );
}
