import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SideNav from '../components/SideNav';
import GlassSurface from '../components/GlassSurface/GlassSurface';
import axiosInstance from '../utils/axiosInstance';

// Equipment icons
import ventilatorIcon from '../assets/ventilation.png';
import defibrillatorIcon from '../assets/defribillator.png';
import ecgIcon from '../assets/ecg.png';
import labIcon from '../assets/lab.png';

const Equipment = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [equipmentList, setEquipmentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    equipment_name: '',
    status: 'working'
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Fetch equipment data from API
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get admin_id from localStorage (user_id is same as admin_id)
      const adminId = localStorage.getItem('userId');
      
      if (!adminId) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // First, get the hospital_id for this admin
      const hospitalRes = await axiosInstance.post('/hospital/admin_hospital', {
        admin_id: Number(adminId)
      });

      if (hospitalRes.data.status !== 'success') {
        setError('Error fetching hospital information');
        setLoading(false);
        return;
      }

      const hospitalId = hospitalRes.data.hospital_id;

      // Now fetch all equipment for this hospital
      const equipmentRes = await axiosInstance.post('/hospital/total_equipment', {
        hospital_id: hospitalId,
        admin_id: Number(adminId)
      });

      if (equipmentRes.data.status !== 'success') {
        setError('Error fetching equipments');
        setLoading(false);
        return;
      }

      // Map API response to component format
      const mappedEquipment = equipmentRes.data.equipment.map(item => ({
        id: item.equipment_id,
        name: item.name,
        status: mapStatus(item.status),
        lastChecked: new Date(item.last_checked)
      }));

      setEquipmentList(mappedEquipment);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching equipment:', err);
      setError('Error fetching equipments');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Map backend status to frontend display status
  const mapStatus = (status) => {
    switch (status) {
      case 'working':
        return 'Available';
      case 'maintenance':
        return 'Maintenance';
      case 'down':
        return 'Out of Order';
      default:
        return 'In Use';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'In Use':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'Maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'Out of Order':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getEquipmentIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('ventilator')) return ventilatorIcon;
    if (lowerName.includes('defibrillator')) return defibrillatorIcon;
    if (lowerName.includes('ecg') || lowerName.includes('monitor')) return ecgIcon;
    return labIcon; // default icon for all other equipment
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredEquipment = equipmentList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    All: equipmentList.length,
    Available: equipmentList.filter((e) => e.status === 'Available').length,
    'In Use': equipmentList.filter((e) => e.status === 'In Use').length,
    Maintenance: equipmentList.filter((e) => e.status === 'Maintenance').length,
    'Out of Order': equipmentList.filter((e) => e.status === 'Out of Order').length,
  };

  // Handle opening add modal
  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setFormData({ equipment_name: '', status: 'working' });
    setSubmitError(null);
  };

  // Handle closing add modal
  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setFormData({ equipment_name: '', status: 'working' });
    setSubmitError(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmitEquipment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const adminId = localStorage.getItem('userId');
      
      if (!adminId) {
        setSubmitError('User not authenticated');
        setSubmitting(false);
        return;
      }

      const response = await axiosInstance.post('/equipment/add', {
        admin_id: Number(adminId),
        equipment_name: formData.equipment_name,
        status: formData.status
      });

      if (response.data.status === 'success') {
        // Close modal and refresh equipment list
        handleCloseAddModal();
        fetchEquipment();
      } else {
        setSubmitError(response.data.message || 'Error adding equipment');
      }
    } catch (err) {
      console.error('Error adding equipment:', err);
      setSubmitError(err.response?.data?.message || 'Error adding equipment');
    } finally {
      setSubmitting(false);
    }
  };

  // Reverse map: frontend display status -> backend status
  const reverseMapStatus = (displayStatus) => {
    switch (displayStatus) {
      case 'Available': return 'working';
      case 'Maintenance': return 'maintenance';
      case 'Out of Order': return 'down';
      case 'In Use': return 'in_use';
      default: return 'working';
    }
  };

  // Status options for the dropdown (display label -> backend value)
  const statusOptions = [
    { label: 'Available', value: 'working', color: 'text-green-400' },
    { label: 'Maintenance', value: 'maintenance', color: 'text-yellow-400' },
    { label: 'Out of Order', value: 'down', color: 'text-red-400' },
  ];

  // Handle status change
  const handleStatusChange = async (equipmentId, newBackendStatus) => {
    setUpdatingStatus(equipmentId);
    setOpenMenuId(null);
    try {
      const adminId = localStorage.getItem('userId');
      if (!adminId) return;

      const response = await axiosInstance.post('/equipment/update-status', {
        admin_id: Number(adminId),
        equipment_id: equipmentId,
        status: newBackendStatus
      });

      if (response.data.status === 'success') {
        // Update local state immediately
        setEquipmentList(prev => prev.map(item =>
          item.id === equipmentId
            ? { ...item, status: mapStatus(newBackendStatus), lastChecked: new Date() }
            : item
        ));
      }
    } catch (err) {
      console.error('Error updating equipment status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div className="min-h-screen w-full bg-[#030B12] overflow-x-hidden">
      <SideNav isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="min-h-screen w-full lg:pl-64 relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-[#030B12] border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Equipment</h1>
          <div className="w-10"></div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Equipment Status</h1>
              <p className="text-white/60 text-sm sm:text-base">Monitor and manage hospital equipment inventory</p>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-white/90 rounded-full text-black font-semibold hover:bg-white active:scale-[0.98] transition-transform text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Equipment
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            status !== 'All' && (
              <GlassSurface
                key={status}
                opacity={0.9}
                backgroundOpacity={0.1}
                brightness={50}
                blur={10}
                borderRadius={16}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-xs sm:text-sm">{status}</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{count}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'Available' ? 'bg-green-400' :
                    status === 'In Use' ? 'bg-blue-400' :
                    status === 'Maintenance' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`}></div>
                </div>
              </GlassSurface>
            )
          ))}
        </div>

        {/* Filters */}
        <GlassSurface
          opacity={0.93}
          backgroundOpacity={0.1}
          brightness={50}
          blur={11}
          borderRadius={16}
          className="p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:w-96">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
              {Object.keys(statusCounts).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {status} ({statusCounts[status]})
                </button>
              ))}
            </div>
          </div>
        </GlassSurface>

        {/* Equipment Table */}
        <GlassSurface
          opacity={0.93}
          backgroundOpacity={0.1}
          brightness={50}
          blur={11}
          borderRadius={16}
          className=""
        >
          <div 
            className="-mx-4 sm:mx-0 px-4 sm:px-0"
            style={{ 
              overflowX: 'auto', 
              WebkitOverflowScrolling: 'touch',
              overflowY: 'visible'
            }}
          >
            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center text-white/60">
                <svg
                  className="w-12 h-12 mx-auto mb-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <p>Loading equipment...</p>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-8 text-center text-red-400">
                <svg
                  className="w-12 h-12 mx-auto mb-4 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-lg font-medium">Error fetching equipments</p>
                <p className="text-white/40 text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Equipment Table - Only show when not loading and no error */}
            {!loading && !error && (
              <>
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-4 text-white/60 font-medium text-sm sm:text-base">Equipment Name</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm sm:text-base">Status</th>
                      <th className="text-left p-4 text-white/60 font-medium text-sm sm:text-base">Last Checked</th>
                      <th className="text-right p-4 text-white/60 font-medium text-sm sm:text-base">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                          index === filteredEquipment.length - 1 ? 'border-b-0' : ''
                        }`}
                      >
                        <td className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 rounded-lg flex items-center justify-center p-1 sm:p-1.5">
                              <img
                                src={getEquipmentIcon(item.name)}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="text-white font-medium text-sm sm:text-base">{item.name}</span>
                          </div>
                        </td>
                        <td className="p-3 sm:p-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3 sm:p-4 text-white/60 text-sm sm:text-base">{formatDate(item.lastChecked)}</td>
                        <td className="p-3 sm:p-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openMenuId === item.id) {
                                  setOpenMenuId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  // Check if dropdown would go below viewport
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const menuHeight = 160; // approximate dropdown height
                                  setMenuPos({
                                    top: spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4,
                                    right: window.innerWidth - rect.right,
                                  });
                                  setOpenMenuId(item.id);
                                }
                              }}
                              className={`p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white ${
                                updatingStatus === item.id ? 'animate-pulse' : ''
                              }`}
                              disabled={updatingStatus === item.id}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                />
                              </svg>
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredEquipment.length === 0 && (
                  <div className="p-8 text-center text-white/40">
                    <svg
                      className="w-12 h-12 mx-auto mb-4 opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p>No equipment found matching your criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        </GlassSurface>
        </div>
      </main>

      {/* Status change dropdown - rendered as portal to avoid overflow clipping */}
      {openMenuId !== null && createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setOpenMenuId(null)}
        >
          <div
            className="fixed w-48 bg-[#0a1929]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden"
            style={{ top: menuPos.top, right: menuPos.right }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wider">Change Status</p>
            </div>
            {statusOptions.map((opt) => {
              const currentItem = equipmentList.find(eq => eq.id === openMenuId);
              const isCurrent = currentItem?.status === opt.label;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(openMenuId, opt.value)}
                  disabled={isCurrent}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                    isCurrent
                      ? 'bg-white/5 text-white/30 cursor-default'
                      : 'hover:bg-white/10 text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    opt.value === 'working' ? 'bg-green-400' :
                    opt.value === 'maintenance' ? 'bg-yellow-400' : 'bg-red-400'
                  }`}></span>
                  <span>{opt.label}</span>
                  {isCurrent && (
                    <svg className="w-4 h-4 ml-auto text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassSurface
            opacity={0.95}
            backgroundOpacity={0.15}
            brightness={60}
            blur={15}
            borderRadius={20}
            className="w-full max-w-md p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Add Equipment</h2>
              <button
                onClick={handleCloseAddModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitEquipment} className="space-y-4">
              {/* Equipment Name */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Equipment Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="equipment_name"
                  value={formData.equipment_name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Ventilator, ECG Monitor"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Status <span className="text-red-400">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-colors"
                >
                  <option value="working" className="bg-gray-800">Working</option>
                  <option value="maintenance" className="bg-gray-800">Maintenance</option>
                  <option value="down" className="bg-gray-800">Out of Order</option>
                </select>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  {submitError}
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseAddModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-white/90 hover:bg-white rounded-lg text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Equipment'
                  )}
                </button>
              </div>
            </form>
          </GlassSurface>
        </div>
      )}
    </div>
  );
};

export default Equipment;
