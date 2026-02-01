import { useState } from "react";
import SideNav from "../components/SideNav";
import TopNavbar from "../components/TopNavbar";
import GlassSurface from "../components/GlassSurface/GlassSurface";

export default function AmbulanceDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const drivers = [
    { name: "Driver Sharma", status: "Active" },
    { name: "Driver Name", status: "Active" },
    { name: "Driver Name", status: "Active" },
    { name: "Driver Name", status: "Inactive" },
  ];

  const pendingDrivers = ["Driver Name", "Driver Name", "Driver Name"];

  return (
    <div className="min-h-screen w-full bg-[#030B12] overflow-x-hidden">
      <SideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="min-h-screen w-full lg:pl-64 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#0a1628] text-white border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Ambulances</h1>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <TopNavbar title="Ambulances" subtitle="Ambulance Management Dashboard" />
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-4 sm:mb-6">
            Ambulance Management
          </h1>

          <div className="flex flex-col gap-4 sm:gap-6">
            {/* Active Ambulance Drivers Card */}
            <GlassSurface
              opacity={0.9}
              backgroundOpacity={0.1}
              brightness={50}
              blur={10}
              borderRadius={16}
              className="p-4 sm:p-6 overflow-hidden"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                Active Ambulance Drivers
              </h2>

              {/* Table Container with horizontal scroll on mobile */}
              <div 
                className="-mx-4 sm:mx-0"
                style={{ 
                  overflowX: 'auto', 
                  WebkitOverflowScrolling: 'touch',
                  overflowY: 'visible'
                }}
              >
                <div className="min-w-[550px] px-4 sm:px-0">
                  {/* Table Header */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] text-white/60 font-medium border-b border-white/10 pb-3 text-sm sm:text-base">
                    <span>Name</span>
                    <span>Vehicle #</span>
                    <span>Status</span>
                    <span>Current Assign</span>
                  </div>

                  {/* Rows */}
                  {drivers.map((d, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center py-3 sm:py-4 border-b border-white/5 hover:bg-white/5 transition-colors text-sm sm:text-base"
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 flex-shrink-0"></div>
                        <span className="truncate text-white">{d.name}</span>
                      </div>

                      <span className="text-white/60">Vehicle #</span>

                      <span
                        className={`px-2 sm:px-4 py-1 rounded-full text-xs sm:text-sm w-fit
                          ${d.status === "Active"
                              ? "bg-green-500/20 text-green-400"
                              : d.status === "Inactive"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-white/10 text-white/60"
                          }
                        `}
                      >
                        {d.status}
                      </span>

                      <span className="truncate text-white/60">Current Assign</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassSurface>

            {/* RIGHT CARD removed as requested */}
          </div>
        </main>
      </div>
    </div>
  );
}


