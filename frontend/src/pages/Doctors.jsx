import { useState, useEffect, useCallback } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import { getDoctorsForAdmin, getDepartments } from '../api/doctorApi';

const Doctors = () => {
  const [activeTab, setActiveTab] = useState('Department');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'On-Duty', 'Off-Duty'
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  
  const userId = localStorage.getItem('userId');

  // Fetch doctors from API
  const fetchDoctors = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const result = await getDoctorsForAdmin(userId);
      if (result.success) {
        setDoctors(result.data);
        setFilteredDoctors(result.data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch departments for filter
  const fetchDepartments = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await getDepartments(userId);
      if (result.success) {
        setDepartments(result.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, [fetchDoctors, fetchDepartments]);

  // Filter doctors based on search and filters
  useEffect(() => {
    let filtered = [...doctors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.name?.toLowerCase().includes(query) ||
        doctor.department?.toLowerCase().includes(query) ||
        doctor.mrn?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doctor => doctor.status === statusFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(doctor => 
        doctor.department?.toLowerCase() === departmentFilter.toLowerCase()
      );
    }

    setFilteredDoctors(filtered);
  }, [doctors, searchQuery, statusFilter, departmentFilter]);

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
                {/* Department Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowDepartmentDropdown(!showDepartmentDropdown);
                      setShowStatusDropdown(false);
                    }}
                    className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 text-sm sm:text-base ${
                      activeTab === 'Department'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Department {departmentFilter !== 'all' && `(${departmentFilter})`}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  {showDepartmentDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-[#0a1628] border border-white/20 rounded-lg shadow-lg z-10 min-w-[150px]">
                      <button
                        onClick={() => {
                          setDepartmentFilter('all');
                          setActiveTab('Department');
                          setShowDepartmentDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${departmentFilter === 'all' ? 'text-blue-400' : 'text-white/80'}`}
                      >
                        All Departments
                      </button>
                      {departments.map((dept) => (
                        <button
                          key={dept}
                          onClick={() => {
                            setDepartmentFilter(dept);
                            setActiveTab('Department');
                            setShowDepartmentDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${departmentFilter === dept ? 'text-blue-400' : 'text-white/80'}`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Filter */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowStatusDropdown(!showStatusDropdown);
                      setShowDepartmentDropdown(false);
                    }}
                    className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors flex items-center gap-2 text-sm sm:text-base ${
                      activeTab === 'Status'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-white/60 hover:text-white'
                    }`}
                  >
                    Status {statusFilter !== 'all' && `(${statusFilter})`}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
                    </svg>
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-[#0a1628] border border-white/20 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setActiveTab('Status');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${statusFilter === 'all' ? 'text-blue-400' : 'text-white/80'}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('On-Duty');
                          setActiveTab('Status');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-2 ${statusFilter === 'On-Duty' ? 'text-blue-400' : 'text-white/80'}`}
                      >
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        On-Duty
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('Off-Duty');
                          setActiveTab('Status');
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 flex items-center gap-2 ${statusFilter === 'Off-Duty' ? 'text-blue-400' : 'text-white/80'}`}
                      >
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Off-Duty
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search by name, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-4 pr-10 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-white/40 text-sm sm:text-base"
                />
                <svg className="w-5 h-5 text-white/40 absolute right-3 top-1/2 transform -translate-y-1/2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>

            {/* Results count */}
            <div className="mb-4 text-white/60 text-sm">
              Showing {filteredDoctors.length} of {doctors.length} doctors
              {(searchQuery || statusFilter !== 'all' || departmentFilter !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setDepartmentFilter('all');
                  }}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                >
                  Clear filters
                </button>
              )}
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
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-white/60">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading doctors...
                        </div>
                      </td>
                    </tr>
                  ) : filteredDoctors.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-white/60">
                        {doctors.length === 0 ? 'No doctors found in this facility' : 'No doctors match your search criteria'}
                      </td>
                    </tr>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <tr key={doctor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 sm:py-4 px-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-semibold text-sm sm:text-base">
                              {doctor.firstName ? doctor.firstName.charAt(0).toUpperCase() : 'D'}
                            </div>
                            <div>
                              <span className="font-medium text-white text-sm sm:text-base block">{doctor.name}</span>
                              {doctor.qualifications && doctor.qualifications.length > 0 && (
                                <span className="text-white/40 text-xs">{doctor.qualifications.join(', ')}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 sm:py-4 px-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                              doctor.status === 'On-Duty'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {doctor.status}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 px-4 text-white/60 text-sm sm:text-base">{doctor.department}</td>
                        <td className="py-3 sm:py-4 px-4 text-white/60 text-sm sm:text-base">{doctor.lastCheckIn}</td>
                      </tr>
                    ))
                  )}
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
