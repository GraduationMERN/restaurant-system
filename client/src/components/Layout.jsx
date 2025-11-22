import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      
      {/* Page Content */}
      <div className="flex-grow w-full flex justify-center">
        <div className="w-full max-w-xl px-4">
          {children}
        </div>
      </div>

      {/* Bottom Navbar */}
     
        <div className="w-full max-w-xl mx-auto h-20 flex justify-between items-center px-4">
          {/* Navbar buttons */}
            <Navbar></Navbar>
        </div>

    </div>
  );
}
