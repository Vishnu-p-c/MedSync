import DashboardLayout from "../layout/DashboardLayout";

export default function AmbulanceDashboard() {
  const drivers = [
    { name: "Driver Sharma", status: "Active" },
    { name: "Driver Name", status: "Active" },
    { name: "Driver Name", status: "Active" },
    { name: "Driver Name", status: "Inactive" },
  ];

  const pendingDrivers = ["Driver Name", "Driver Name", "Driver Name"];

  return (
    <DashboardLayout>
      <div className="bg-gray-100 p-4 sm:p-6 lg:p-10 font-sans min-h-screen">
      {/* Title */}
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold mb-4 sm:mb-6">
        Ambulance Management
      </h1>

  <div className="flex flex-col gap-4 sm:gap-6">
        {/* Active Ambulance Drivers Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 overflow-hidden">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            Active Ambulance Drivers
          </h2>

          {/* Table Container with horizontal scroll on mobile */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[500px] px-4 sm:px-0">
              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] text-gray-500 font-medium border-b pb-3 text-sm sm:text-base">
                <span>Name</span>
                <span>Vehicle #</span>
                <span>Status</span>
                <span className="hidden sm:block">Current Assign</span>
              </div>

              {/* Rows */}
              {drivers.map((d, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center py-3 sm:py-4 border-b text-sm sm:text-base"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-300 flex-shrink-0"></div>
                    <span className="truncate">{d.name}</span>
                  </div>

                  <span>Vehicle #</span>

                  <span
                    className={`px-2 sm:px-4 py-1 rounded-full text-xs sm:text-sm w-fit
                      ${
                        d.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : d.status === "Inactive"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-600"
                      }
                    `}
                  >
                    {d.status}
                  </span>

                  <span className="hidden sm:block truncate">Current Assign</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT CARD removed as requested */}
      </div>
      </div>
    </DashboardLayout>
  );
}


