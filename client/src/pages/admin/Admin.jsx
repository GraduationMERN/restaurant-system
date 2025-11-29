import { useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Rewards from "./Rewards";
import Menu from "./Menu";
import Reviews from "./Reviews";
import Settings from "./Settings";
import UserProfiles from "./UserProfiles";
import Users from "./Users";

export default function Admin() {
    const { section: rawSection } = useParams();
    const allowed = new Set(["dashboard", "orders", "menu", "reviews", "rewards", "settings", "profile", "users"]);
    const section = rawSection && allowed.has(rawSection) ? rawSection : "dashboard";

    return (
        <>
            <PageMeta title="Admin" description="All sections in one page" />
            {section === "dashboard" && (
                <section id="dashboard" className="mt-0">
                    <Dashboard />
                </section>
            )}
            {section === "orders" && (
                <section id="orders" className="mt-8">
                    <Orders />
                </section>
            )}

            {section === "menu" && (
                <section id="menu" className="mt-8">
                    <Menu />
                </section>
            )}

            {section === "reviews" && (
                <section id="reviews" className="mt-8">
                    <Reviews />
                </section>
            )}

            {section === "rewards" && (
                <section id="rewards" className="mt-8">
                    <Rewards />
                </section>
            )}

            {section === "settings" && (
                <section id="settings" className="mt-8">
                    <Settings />
                </section>
            )}

            {section === "profile" && (
                <section id="profile" className="mt-8">
                    <UserProfiles />
                </section>
            )}
            {section === "users" && (
                <section id="users" className="mt-8">
                    <Users />
                </section>
            )}
        </>
    );
}

