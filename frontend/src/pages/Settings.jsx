import { useState, useEffect, useCallback } from 'react';
import SideNav from '../components/SideNav';
import TopNavbar from '../components/TopNavbar';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import { getProfile, updateProfile, changePassword, getHospitalInfo, updateHospitalInfo } from '../api/settingsApi';

const Settings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  // Profile state
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    role: '',
    dateOfBirth: '',
    gender: '',
    address: ''
  });

  // Hospital info state
  const [hospitalInfo, setHospitalInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    district: ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const userId = localStorage.getItem('userId');

  // Fetch hospital info
  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await getProfile(userId);
      if (response.status === 'success') {
        const data = response.data;
        setProfile({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          username: data.username || '',
          role: data.role || '',
          dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth).toISOString().split('T')[0] : '',
          gender: data.gender || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, [userId]);

  // Fetch hospital info
  const fetchHospitalInfo = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await getHospitalInfo(userId);
      if (response.status === 'success') {
        setHospitalInfo({
          name: response.data.name || '',
          address: response.data.address || '',
          phone: response.data.phone || '',
          email: response.data.email || '',
          district: response.data.district || ''
        });
      }
    } catch (error) {
      console.error('Error fetching hospital info:', error);
    }
  }, [userId]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setPageLoading(true);
      await Promise.all([fetchProfile(), fetchHospitalInfo()]);
      setPageLoading(false);
    };
    loadData();
  }, [fetchProfile, fetchHospitalInfo]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleHospitalChange = (e) => {
    const { name, value } = e.target;
    setHospitalInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setPasswordError('');
  };

  // Save profile
  const handleSaveProfile = async () => {
    setLoading(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const response = await updateProfile({
        user_id: parseInt(userId),
        first_name: profile.firstName,
        last_name: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        date_of_birth: profile.dateOfBirth,
        gender: profile.gender
      });

      if (response.status === 'success') {
        setSaveSuccess('Profile updated successfully!');
        if (response.data.fullName) {
          localStorage.setItem('userName', response.data.fullName);
        }
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (error) {
      setSaveError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Save hospital info
  const handleSaveHospital = async () => {
    setLoading(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const response = await updateHospitalInfo({
        admin_id: parseInt(userId),
        name: hospitalInfo.name,
        address: hospitalInfo.address,
        phone: hospitalInfo.phone,
        email: hospitalInfo.email,
        district: hospitalInfo.district
      });

      if (response.status === 'success') {
        setSaveSuccess('Hospital info updated successfully!');
        setTimeout(() => setSaveSuccess(''), 3000);
      }
    } catch (error) {
      setSaveError(error.response?.data?.message || 'Failed to update hospital info');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordLoading(true);

    try {
      const response = await changePassword({
        user_id: parseInt(userId),
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });

      if (response.status === 'success') {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(''), 3000);
      }
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const settingsSections = [
    { id: 'profile', label: 'Profile', icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
      </svg>
    )},
    { id: 'hospital', label: 'Hospital Info', icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd"/>
      </svg>
    )},
    { id: 'security', label: 'Security', icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
      </svg>
    )}
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
          <h1 className="text-lg font-semibold">Settings</h1>
          <div className="w-10"></div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:block">
          <TopNavbar title="Settings" subtitle="Manage your preferences" />
        </div>

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {pageLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white/60">Loading settings...</span>
              </div>
            </div>
          ) : (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Settings Navigation */}
              <GlassSurface
                opacity={0.9}
                backgroundOpacity={0.1}
                brightness={50}
                blur={10}
                borderRadius={16}
                className="p-4 lg:w-64 shrink-0"
              >
                <h3 className="text-white font-semibold mb-4 px-2">Settings</h3>
                <nav className="space-y-1">
                  {settingsSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                        activeSection === section.id
                          ? 'bg-blue-600 text-white'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {section.icon}
                      <span>{section.label}</span>
                    </button>
                  ))}
                </nav>
              </GlassSurface>

              {/* Settings Content */}
              <GlassSurface
                opacity={0.9}
                backgroundOpacity={0.1}
                brightness={50}
                blur={10}
                borderRadius={16}
                className="flex-1 p-6"
              >
                {/* Success/Error Messages */}
                {saveSuccess && (
                  <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                    {saveSuccess}
                  </div>
                )}
                {saveError && (
                  <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                    </svg>
                    {saveError}
                  </div>
                )}

                {/* Profile Section */}
                {activeSection === 'profile' && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6">Profile Settings</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-white/60 text-sm mb-1">First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={profile.firstName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          value={profile.lastName}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={profile.email}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Phone *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={profile.phone}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Username</label>
                        <input
                          type="text"
                          value={profile.username}
                          disabled
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white/60 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Role</label>
                        <input
                          type="text"
                          value={profile.role}
                          disabled
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white/60 cursor-not-allowed capitalize"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={profile.dateOfBirth}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Gender</label>
                        <select
                          name="gender"
                          value={profile.gender}
                          onChange={handleProfileChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        >
                          <option value="" className="bg-[#0a1628]">Select Gender</option>
                          <option value="male" className="bg-[#0a1628]">Male</option>
                          <option value="female" className="bg-[#0a1628]">Female</option>
                          <option value="other" className="bg-[#0a1628]">Other</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 text-sm mb-1">Address</label>
                        <textarea
                          name="address"
                          value={profile.address}
                          onChange={handleProfileChange}
                          rows={3}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                        />
                      </div>
                    </div>
                    
                    {/* Save Button for Profile */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Profile'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Hospital Info Section */}
                {activeSection === 'hospital' && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6">Hospital Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 text-sm mb-1">Hospital Name</label>
                        <input
                          type="text"
                          name="name"
                          value={hospitalInfo.name}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 text-sm mb-1">Address</label>
                        <textarea
                          name="address"
                          value={hospitalInfo.address}
                          onChange={handleHospitalChange}
                          rows={2}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">District</label>
                        <input
                          type="text"
                          name="district"
                          value={hospitalInfo.district}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-white/60 text-sm mb-1">Contact Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={hospitalInfo.phone}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-white/60 text-sm mb-1">Contact Email</label>
                        <input
                          type="email"
                          name="email"
                          value={hospitalInfo.email}
                          onChange={handleHospitalChange}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                        />
                      </div>
                    </div>
                    
                    {/* Save Button for Hospital */}
                    <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
                      <button
                        onClick={handleSaveHospital}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          'Save Hospital Info'
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Security Section */}
                {activeSection === 'security' && (
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
                    <div className="space-y-6">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <h3 className="text-white font-medium mb-4">Change Password</h3>
                        
                        {/* Password Success/Error Messages */}
                        {passwordSuccess && (
                          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 rounded-lg text-green-400 text-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            {passwordSuccess}
                          </div>
                        )}
                        {passwordError && (
                          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                            </svg>
                            {passwordError}
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-white/60 text-sm mb-1">Current Password</label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                              placeholder="Enter current password"
                            />
                          </div>
                          <div>
                            <label className="block text-white/60 text-sm mb-1">New Password</label>
                            <input
                              type="password"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                              placeholder="Enter new password (min 6 characters)"
                            />
                          </div>
                          <div>
                            <label className="block text-white/60 text-sm mb-1">Confirm New Password</label>
                            <input
                              type="password"
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                              placeholder="Confirm new password"
                            />
                          </div>
                          <button 
                            onClick={handleChangePassword}
                            disabled={passwordLoading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
                          >
                            {passwordLoading ? (
                              <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </>
                            ) : (
                              'Update Password'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </GlassSurface>
            </div>
          </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
