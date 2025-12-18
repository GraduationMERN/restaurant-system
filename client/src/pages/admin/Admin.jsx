import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Rewards from "./Rewards";
import Menu from "./Menu";
import Categories from "./Categories";
import Reviews from "./Reviews";
import Settings from "./Settings";
import UserProfiles from "./UserProfiles";
import RewardOrders from "./RewardOrders";
import Users from "./Users";
import Offers from "./Offers";

export default function Admin() {
  const { section: rawSection } = useParams();
  const allowed = new Set([
    "dashboard",
    "orders",
    "menu",
    "reviews",
    "categories",
    "rewards",
    "settings",
    "profile",
    "users",
    "reward-orders",
    "offers",
  ]);
  const section =
    rawSection && allowed.has(rawSection) ? rawSection : "dashboard";

  // Responsive padding/margin classes
  const contentClasses = "mt-0 lg:mt-4";

  return (
    <>
      <PageMeta title="Admin" description="All sections in one page" />
      <div className="max-w-screen-2xl mx-auto">
        {section === "dashboard" && (
          <section id="dashboard" className={contentClasses}>
            <Dashboard />
          </section>
        )}
        {section === "orders" && (
          <section id="orders" className={contentClasses}>
            <Orders />
          </section>
        )}

        {section === "menu" && (
          <section id="menu" className={contentClasses}>
            <Menu />
          </section>
        )}

        {section === "categories" && (
          <section id="categories" className={contentClasses}>
            <Categories />
          </section>
        )}

        {section === "reviews" && (
          <section id="reviews" className={contentClasses}>
            <Reviews />
          </section>
        )}

        {section === "rewards" && (
          <section id="rewards" className={contentClasses}>
            <Rewards />
          </section>
        )}
        {section === "reward-orders" && (
          <section id="reward-orders" className={contentClasses}>
            <RewardOrders />
          </section>
        )}

        {section === "offers" && (
          <section id="offers" className={contentClasses}>
            <Offers />
          </section>
        )}

        {section === "settings" && (
          <section id="settings" className={contentClasses}>
            <Settings />
          </section>
        )}
        {section === "users" && (
          <section id="users" className={contentClasses}>
            <Users />
          </section>
        )}

        {section === "profile" && (
          <section id="profile" className={contentClasses}>
            <UserProfiles />
          </section>
        )}
        {section === "users" && (
          <section id="users" className={contentClasses}>
            <Users />
          </section>
        )}
      </div>
    </>
  );
}