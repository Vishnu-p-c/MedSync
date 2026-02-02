import { useState, useEffect, useCallback } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import { getDoctorsForAdmin, getDepartments, addDoctor } from '../api/doctorApi';

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
  
  // Add Doctor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [newDoctor, setNewDoctor] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    gender: 'male',
    mrn: '',
    department: '',
    qualifications: ''
  });
  
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

  // Handle input change for add doctor form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDoctor(prev => ({ ...prev, [name]: value }));
  };

  // Reset form
  const resetForm = () => {
    setNewDoctor({
      first_name: '',
      last_name: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      date_of_birth: '',
      gender: 'male',
      mrn: '',
      department: '',
      qualifications: ''
    });
    setAddError('');
    setAddSuccess('');
  };

  // Handle add doctor submit
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setAddingDoctor(true);
    setAddError('');
    setAddSuccess('');

    try {
      // Parse qualifications as comma-separated values
      const qualificationsArray = newDoctor.qualifications
        .split(',')
        .map(q => q.trim())
        .filter(q => q);

      const doctorData = {
        admin_id: userId,
        ...newDoctor,
        qualifications: qualificationsArray
      };

      const result = await addDoctor(doctorData);

      if (result.success) {
        setAddSuccess(`Doctor ${result.data.name} added successfully! Username: ${result.data.username}`);
        resetForm();
        fetchDoctors(); // Refresh the list
        fetchDepartments(); // Refresh departments in case new one was added
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowAddModal(false);
          setAddSuccess('');
        }, 2000);
      } else {
        // Handle specific error messages
        const errorMessages = {
          'username_already_exists': 'Username is already taken',
          'email_already_exists': 'Email is already registered',
          'phone_already_exists': 'Phone number is already registered',
          'mrn_already_exists': 'Medical Registration Number already exists',
          'missing_fields': 'Please fill in all required fields'
        };
        setAddError(errorMessages[result.error] || result.error || 'Failed to add doctor');
      }
    } catch (error) {
      console.error('Error adding doctor:', error);
      setAddError('An unexpected error occurred');
    } finally {
      setAddingDoctor(false);
    }
  };

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
            {/* Header with Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-semibold text-white">Doctor Attendance & Availability</h2>
              <button
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Doctor
              </button>
            </div>

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
        </main>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0a1628] border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">Add New Doctor</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleAddDoctor} className="p-6">
              {/* Success Message */}
              {addSuccess && (
                <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-sm">
                  {addSuccess}
                </div>
              )}

              {/* Error Message */}
              {addError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Personal Information */}
                <div className="sm:col-span-2">
                  <h4 className="text-white/80 font-medium mb-3 text-sm uppercase tracking-wider">Personal Information</h4>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={newDoctor.first_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="Enter first name"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={newDoctor.last_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="Enter last name"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={newDoctor.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="doctor@email.com"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={newDoctor.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={newDoctor.date_of_birth}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={newDoctor.gender}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  >
                    <option value="male" className="bg-[#0a1628]">Male</option>
                    <option value="female" className="bg-[#0a1628]">Female</option>
                    <option value="other" className="bg-[#0a1628]">Other</option>
                  </select>
                </div>

                {/* Login Credentials */}
                <div className="sm:col-span-2 mt-4">
                  <h4 className="text-white/80 font-medium mb-3 text-sm uppercase tracking-wider">Login Credentials</h4>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={newDoctor.username}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="doctor_username"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={newDoctor.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                {/* Professional Information */}
                <div className="sm:col-span-2 mt-4">
                  <h4 className="text-white/80 font-medium mb-3 text-sm uppercase tracking-wider">Professional Information</h4>
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Medical Registration No. (MRN) *</label>
                  <input
                    type="text"
                    name="mrn"
                    value={newDoctor.mrn}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="MRN12345"
                  />
                </div>

                <div>
                  <label className="block text-white/60 text-sm mb-1">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={newDoctor.department}
                    onChange={handleInputChange}
                    required
                    list="department-list"
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="e.g., Cardiology, Oncology"
                  />
                  <datalist id="department-list">
                    {departments.map((dept) => (
                      <option key={dept} value={dept} />
                    ))}
                  </datalist>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-white/60 text-sm mb-1">Qualifications *</label>
                  <input
                    type="text"
                    name="qualifications"
                    value={newDoctor.qualifications}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40"
                    placeholder="MBBS, MD, MS (comma separated)"
                  />
                  <p className="text-white/40 text-xs mt-1">Enter qualifications separated by commas</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingDoctor}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {addingDoctor ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Doctor'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
