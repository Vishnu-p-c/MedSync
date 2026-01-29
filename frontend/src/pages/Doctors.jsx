import { useState } from 'react';
import SideNav from '../components/SideNav';

const Doctors = () => {
  const [activeTab, setActiveTab] = useState('Department');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sample doctor data
  const doctors = [
    {
      id: 1,
      name: 'Dr. A. Sharma',
      department: 'Department',
      status: 'On-Duty',
      lastCheckIn: '2:20 PM IST',
      avatar: '👨‍⚕️'
    },
    {
      id: 2,
      name: 'Doctor Smith',
      department: 'Department',
      status: 'On-Duty',
      lastCheckIn: '1:55 PM IST',
      avatar: '👨‍⚕️'
    },
    {
      id: 3,
      name: 'Doctor Smith',
      department: 'Department',
      status: 'Off-Duty',
      lastCheckIn: 'Yesterday, 6:30 PM IST',
      avatar: '👨‍⚕️'
    },
    {
      id: 4,
      name: 'Doctor Halder',
      department: 'Critical',
      status: 'On-Duty',
      lastCheckIn: 'This morning, 9:00 AM',
      avatar: '👨‍⚕️'
    },
    {
      id: 5,
      name: 'Dr. A. Sharma',
      department: 'Department',
      status: 'Off-Duty',
      lastCheckIn: '10/01/2026',
      avatar: '👨‍⚕️'
    },
    {
      id: 6,
      name: 'Doctor Sharma',
      department: 'Department',
      status: 'On-Duty',
      lastCheckIn: '10/01/2026',
      avatar: '👨‍⚕️'
    },
    {
      id: 7,
      name: 'Junior Nath',
      department: 'Department',
      status: 'On-Duty',
      lastCheckIn: '10/2026',
      avatar: '👨‍⚕️'
    }
  ];

  return (
    <div className="flex min-h-screen bg-slate-100">
      <SideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 flex flex-col">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#2c3e50] text-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Doctors</h1>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <header className="hidden lg:flex bg-[#34495e] text-white px-8 py-4 justify-between items-center">
          <h1 className="text-lg font-semibold">St. Mary's General Hospital</h1>
          <div className="text-sm">Friday, January 23, 2026 at 2:25 PM IST</div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 max-w-7xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">Doctor Attendance & Availability</h2>

            {/* Tabs and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('Department')}
                  className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors text-sm sm:text-base ${
                    activeTab === 'Department'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Department
                </button>
                <button
                  onClick={() => setActiveTab('Status')}
                  className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 text-sm sm:text-base ${
                    activeTab === 'Status'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Status
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                </button>
              </div>

              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full sm:w-auto pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                />
                <svg className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm sm:text-base">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm sm:text-base hidden sm:table-cell">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm sm:text-base">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm sm:text-base hidden md:table-cell">Last Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 sm:py-4 px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg sm:text-xl">
                            {doctor.avatar}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800 text-sm sm:text-base block">{doctor.name}</span>
                            <span className="text-xs text-gray-500 sm:hidden">{doctor.department}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-4 text-gray-600 text-sm sm:text-base hidden sm:table-cell">{doctor.department}</td>
                      <td className="py-3 sm:py-4 px-4">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            doctor.status === 'On-Duty'
                              ? 'bg-green-100 text-green-700'
                              : doctor.status === 'Off-Duty'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {doctor.status}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-4 text-gray-600 text-sm sm:text-base hidden md:table-cell">{doctor.lastCheckIn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Floating Avatar removed as requested */}
        </main>
      </div>
    </div>
  );
};

export default Doctors;
