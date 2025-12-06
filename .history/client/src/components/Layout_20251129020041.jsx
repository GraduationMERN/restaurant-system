/* Layout.jsx */
import DesktopNav from "./DesktopNav";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
const location = useLocation();
const isAdmin = location.pathname.startsWith("/admin");

return ( <div className="min-h-screen w-full flex flex-col bg-default">
{/* Desktop horizontal navbar */}
{!isAdmin && <DesktopNav />}

```
  {/* Main content */}
  <div className={`w-full flex justify-center ${!isAdmin ? "pt-16 md:pt-16" : ""}`}>
    <div className="w-full max-w-xl px-4 md:max-w-none md:px-0">
      {children}
    </div>
  </div>

  {/* Mobile bottom navbar */}
  {!isAdmin && (
    <div className="w-full max-w-xl mx-auto h-16 flex justify-between items-center px-4 md:hidden">
      <Navbar />
    </div>
  )}
</div>
```

);
}
