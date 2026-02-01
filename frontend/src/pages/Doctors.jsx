import { useState } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';

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
          <h1 className="text-lg font-semibold">Doctors</h1>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <TopNavbar title="Doctors" subtitle="Doctor Attendance & Availability" />
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <GlassSurface
            opacity={0.9}
            backgroundOpacity={0.1}
            brightness={50}
            blur={10}
            borderRadius={16}
            className="p-4 sm:p-6 max-w-7xl"
          >
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Doctor Attendance & Availability</h2>

            {/* Tabs and Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('Department')}
                  className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors text-sm sm:text-base ${
                    activeTab === 'Department'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  Department
                </button>
                <button
                  onClick={() => setActiveTab('Status')}
                  className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 text-sm sm:text-base ${
                    activeTab === 'Status'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-white/60 hover:text-white'
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
                  className="w-full sm:w-auto pl-4 pr-10 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40 text-sm sm:text-base"
                />
                <svg className="w-5 h-5 text-white/40 absolute right-3 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>

            {/* Table */}
            <div 
              className="-mx-4 sm:mx-0"
              style={{ 
                overflowX: 'auto', 
                WebkitOverflowScrolling: 'touch',
                overflowY: 'visible'
              }}
            >
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm sm:text-base">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm sm:text-base">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm sm:text-base">Department</th>
                    <th className="text-left py-3 px-4 font-semibold text-white/70 text-sm sm:text-base">Last Check-in</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 sm:py-4 px-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-full flex items-center justify-center text-lg sm:text-xl">
                            {doctor.avatar}
                          </div>
                          <span className="font-medium text-white text-sm sm:text-base">{doctor.name}</span>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 px-4">
                        <span
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            doctor.status === 'On-Duty'
                              ? 'bg-green-500/20 text-green-400'
                              : doctor.status === 'Off-Duty'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          {doctor.status}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 px-4 text-white/60 text-sm sm:text-base">{doctor.department}</td>
                      <td className="py-3 sm:py-4 px-4 text-white/60 text-sm sm:text-base">{doctor.lastCheckIn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassSurface>

          {/* Floating Avatar removed as requested */}
        </main>
      </div>
    </div>
  );
};

export default Doctors;
