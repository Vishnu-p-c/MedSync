import { Bell } from "lucide-react";

function TopNavbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      
    

      {/* Center: Page title */}
      <h2 className="hidden md:block text-base font-medium text-gray-700">
        Admin Dashboard
      </h2>

      {/* Right: Actions */}
      <div className="flex items-center gap-5">

        {/* Notifications */}
        <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
            A
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800">
              Admin
            </p>
            <p className="text-xs text-gray-500">
              Administrator
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}

export default TopNavbar;
