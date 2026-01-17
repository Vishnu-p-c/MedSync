export default function AmbulanceDashboard() {
  const drivers = [
    { name: "Driver Sharma", status: "Active" },
    { name: "Driver Name", status: "Active" },
    { name: "Driver Name", status: "Active" },
    { name: "Driver Name", status: "Inactive" },
  ];

  const pendingDrivers = ["Driver Name", "Driver Name", "Driver Name"];

  return (
    <div className="min-h-screen bg-gray-100 p-10 font-sans">
      {/* Title */}
      <h1 className="text-3xl font-semibold mb-6">
        Ambulance Management
      </h1>

  <div className="flex flex-col md:flex-row gap-6">
        {/* LEFT CARD */}
        <div className="flex-2 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Active Ambulance Drivers
          </h2>

          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr] text-gray-500 font-medium border-b pb-3">
            <span>Name</span>
            <span>Vehicle #</span>
            <span>Status</span>
            <span>Current Assign</span>
          </div>

          {/* Rows */}
          {drivers.map((d, i) => (
            <div
              key={i}
              className="grid grid-cols-[2fr_1fr_1fr_1.5fr] items-center py-4 border-b"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-300"></div>
                <span>{d.name}</span>
              </div>

              <span>Vehicle #</span>

              <span
                className={`px-4 py-1 rounded-full text-sm w-fit
                  ${
                    d.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-600"
                  }
                `}
              >
                {d.status}
              </span>

              <span>Current Assign</span>
            </div>
          ))}
        </div>

        {/* RIGHT CARD */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Pending Driver Approvals
          </h2>

          {pendingDrivers.map((name, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4 border-b"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-300"></div>
                <span>{name}</span>
              </div>

              <div className="flex gap-2">
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                  Approve
                </button>
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


