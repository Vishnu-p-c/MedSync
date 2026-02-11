import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  registerNewDoctor,
  getHospitalsForRegistration,
  getClinicsForRegistration,
  getDepartmentsForRegistration,
  validateDoctorMrn,
  validateDoctorUsername,
  validateDoctorEmail
} from '../../api/doctorRegistrationApi';

/**
 * AddDoctorFormModal Component
 * A modal form for admin users to register new doctors
 */
const AddDoctorFormModal = ({ isOpen, onClose, onSuccess }) => {
  const userId = localStorage.getItem('userId');

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    mrn: '',
    department: '',
    qualifications: '',
    multi_place: false,
    selectedHospitals: [],
    selectedClinics: []
  });

  // Dropdown data
  const [hospitals, setHospitals] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [departments, setDepartments] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1); // Multi-step form

  // Validation state
  const [validationErrors, setValidationErrors] = useState({});
  const [validating, setValidating] = useState({});

  // Fetch dropdown data on mount
  const fetchDropdownData = useCallback(async () => {
    if (!userId) return;

    setLoadingData(true);
    try {
      const [hospitalsRes, clinicsRes, departmentsRes] = await Promise.all([
        getHospitalsForRegistration(userId),
        getClinicsForRegistration(userId),
        getDepartmentsForRegistration(userId)
      ]);

      if (hospitalsRes.success) setHospitals(hospitalsRes.data);
      if (clinicsRes.success) setClinics(clinicsRes.data);
      if (departmentsRes.success) setDepartments(departmentsRes.data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      // Reset form when modal opens
      setFormData({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        mrn: '',
        department: '',
        qualifications: '',
        multi_place: false,
        selectedHospitals: [],
        selectedClinics: []
      });
      setStep(1);
      setError('');
      setSuccess('');
      setValidationErrors({});
    }
  }, [isOpen, fetchDropdownData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle hospital selection
  const handleHospitalToggle = (hospitalId) => {
    setFormData(prev => ({
      ...prev,
      selectedHospitals: prev.selectedHospitals.includes(hospitalId)
        ? prev.selectedHospitals.filter(id => id !== hospitalId)
        : [...prev.selectedHospitals, hospitalId]
    }));
  };

  // Handle clinic selection
  const handleClinicToggle = (clinicId) => {
    setFormData(prev => ({
      ...prev,
      selectedClinics: prev.selectedClinics.includes(clinicId)
        ? prev.selectedClinics.filter(id => id !== clinicId)
        : [...prev.selectedClinics, clinicId]
    }));
  };

  // Validate username
  const handleUsernameBlur = async () => {
    if (!formData.username.trim()) return;

    setValidating(prev => ({ ...prev, username: true }));
    const result = await validateDoctorUsername(formData.username);
    setValidating(prev => ({ ...prev, username: false }));

    if (result.success && !result.isUnique) {
      setValidationErrors(prev => ({ ...prev, username: 'Username already exists' }));
    }
  };

  // Validate email
  const handleEmailBlur = async () => {
    if (!formData.email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Invalid email format' }));
      return;
    }

    setValidating(prev => ({ ...prev, email: true }));
    const result = await validateDoctorEmail(formData.email);
    setValidating(prev => ({ ...prev, email: false }));

    if (result.success && !result.isUnique) {
      setValidationErrors(prev => ({ ...prev, email: 'Email already exists' }));
    }
  };

  // Validate MRN
  const handleMrnBlur = async () => {
    if (!formData.mrn.trim()) return;

    setValidating(prev => ({ ...prev, mrn: true }));
    const result = await validateDoctorMrn(formData.mrn);
    setValidating(prev => ({ ...prev, mrn: false }));

    if (result.success && !result.isUnique) {
      setValidationErrors(prev => ({ ...prev, mrn: 'MRN already exists' }));
    }
  };

  // Validate current step
  const validateStep = () => {
    const errors = {};

    if (step === 1) {
      if (!formData.first_name.trim()) errors.first_name = 'First name is required';
      if (!formData.username.trim()) errors.username = 'Username is required';
      if (!formData.email.trim()) errors.email = 'Email is required';
      if (!formData.password) errors.password = 'Password is required';
      if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.phone.trim()) errors.phone = 'Phone is required';
      if (!formData.date_of_birth) errors.date_of_birth = 'Date of birth is required';
      if (!formData.gender) errors.gender = 'Gender is required';
    }

    if (step === 2) {
      if (!formData.mrn.trim()) errors.mrn = 'MRN is required';
      if (!formData.department.trim()) errors.department = 'Department is required';
      if (!formData.qualifications.trim()) errors.qualifications = 'At least one qualification is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNextStep = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare qualifications array
      const qualificationsArray = formData.qualifications
        .split(',')
        .map(q => q.trim())
        .filter(q => q !== '');

      // Prepare hospitals and clinics names
      const selectedHospitalNames = hospitals
        .filter(h => formData.selectedHospitals.includes(h.id))
        .map(h => h.name);

      const selectedClinicNames = clinics
        .filter(c => formData.selectedClinics.includes(c.id))
        .map(c => c.name);

      const payload = {
        admin_id: userId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        mrn: formData.mrn,
        department: formData.department,
        qualifications: qualificationsArray,
        multi_place: formData.multi_place,
        hospitals: selectedHospitalNames,
        clinics: selectedClinicNames
      };

      const result = await registerNewDoctor(payload);

      if (result.success) {
        setSuccess(`Dr. ${result.data.name} has been registered successfully!`);
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 2000);
      } else {
        // Handle specific error messages
        let errorMessage = 'Failed to register doctor. ';
        if (result.error === 'username_exists') {
          errorMessage = 'Username already exists.';
        } else if (result.error === 'email_exists') {
          errorMessage = 'Email already exists.';
        } else if (result.error === 'phone_exists') {
          errorMessage = 'Phone number already exists.';
        } else if (result.error === 'mrn_exists') {
          errorMessage = 'MRN already exists.';
        } else if (result.error === 'missing_fields') {
          errorMessage = `Missing fields: ${result.missing?.join(', ')}`;
        } else {
          errorMessage += result.error || 'Please try again.';
        }
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a1628] border border-white/20 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-[#0a1628] border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Register New Doctor</h2>
            <p className="text-white/60 text-sm mt-1">Step {step} of 3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pt-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-blue-500' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="p-6 text-center text-white/60">
            <svg className="animate-spin h-8 w-8 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading form data...
          </div>
        )}

        {/* Form */}
        {!loadingData && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                {success}
              </div>
            )}

            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.first_name ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Enter first name"
                    />
                    {validationErrors.first_name && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.first_name}</p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Username <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      onBlur={handleUsernameBlur}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.username ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Enter username"
                    />
                    {validating.username && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                        Checking...
                      </span>
                    )}
                  </div>
                  {validationErrors.username && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.username}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleEmailBlur}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.email ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Enter email address"
                    />
                    {validating.email && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                        Checking...
                      </span>
                    )}
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.password ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Min. 6 characters"
                    />
                    {validationErrors.password && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.confirmPassword ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Confirm password"
                    />
                    {validationErrors.confirmPassword && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                      validationErrors.phone ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {validationErrors.phone && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.phone}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Date of Birth <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.date_of_birth ? 'border-red-500' : 'border-white/20'
                      }`}
                    />
                    {validationErrors.date_of_birth && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.date_of_birth}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      Gender <span className="text-red-400">*</span>
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.gender ? 'border-red-500' : 'border-white/20'
                      }`}
                    >
                      <option value="" className="bg-[#0a1628]">Select gender</option>
                      <option value="male" className="bg-[#0a1628]">Male</option>
                      <option value="female" className="bg-[#0a1628]">Female</option>
                      <option value="other" className="bg-[#0a1628]">Other</option>
                    </select>
                    {validationErrors.gender && (
                      <p className="text-red-400 text-xs mt-1">{validationErrors.gender}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Information */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Professional Information</h3>

                {/* MRN */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Medical Registration Number (MRN) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="mrn"
                      value={formData.mrn}
                      onChange={handleChange}
                      onBlur={handleMrnBlur}
                      className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                        validationErrors.mrn ? 'border-red-500' : 'border-white/20'
                      }`}
                      placeholder="Enter medical registration number"
                    />
                    {validating.mrn && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                        Checking...
                      </span>
                    )}
                  </div>
                  {validationErrors.mrn && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.mrn}</p>
                  )}
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    list="departmentsList"
                    className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                      validationErrors.department ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Enter or select department"
                  />
                  <datalist id="departmentsList">
                    {departments.map((dept, index) => (
                      <option key={index} value={dept} />
                    ))}
                  </datalist>
                  {validationErrors.department && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.department}</p>
                  )}
                </div>

                {/* Qualifications */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">
                    Qualifications <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-white/5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white ${
                      validationErrors.qualifications ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="e.g., MBBS, MD, MS (comma-separated)"
                  />
                  <p className="text-white/40 text-xs mt-1">Separate multiple qualifications with commas</p>
                  {validationErrors.qualifications && (
                    <p className="text-red-400 text-xs mt-1">{validationErrors.qualifications}</p>
                  )}
                </div>

                {/* Multi-place checkbox */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="multi_place"
                    name="multi_place"
                    checked={formData.multi_place}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="multi_place" className="text-sm text-white/80">
                    Doctor consults at multiple locations
                  </label>
                </div>
              </div>
            )}

            {/* Step 3: Hospital/Clinic Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white mb-4">Assign to Hospitals/Clinics</h3>
                <p className="text-white/60 text-sm">
                  Select the hospitals and/or clinics where this doctor will practice. 
                  If none are selected, the doctor will be assigned to your facility.
                </p>

                {/* Hospitals */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Hospitals</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white/5 rounded-lg border border-white/10">
                    {hospitals.length === 0 ? (
                      <p className="text-white/40 text-sm col-span-2 py-2 text-center">No hospitals available</p>
                    ) : (
                      hospitals.map(hospital => (
                        <label
                          key={hospital.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            formData.selectedHospitals.includes(hospital.id)
                              ? 'bg-blue-500/20 border border-blue-500/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedHospitals.includes(hospital.id)}
                            onChange={() => handleHospitalToggle(hospital.id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-white">{hospital.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Clinics */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Clinics</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white/5 rounded-lg border border-white/10">
                    {clinics.length === 0 ? (
                      <p className="text-white/40 text-sm col-span-2 py-2 text-center">No clinics available</p>
                    ) : (
                      clinics.map(clinic => (
                        <label
                          key={clinic.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            formData.selectedClinics.includes(clinic.id)
                              ? 'bg-blue-500/20 border border-blue-500/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedClinics.includes(clinic.id)}
                            onChange={() => handleClinicToggle(clinic.id)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-white">{clinic.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <h4 className="text-sm font-medium text-white/80 mb-2">Registration Summary</h4>
                  <div className="space-y-1 text-sm text-white/60">
                    <p><span className="text-white">Name:</span> {formData.first_name} {formData.last_name}</p>
                    <p><span className="text-white">Email:</span> {formData.email}</p>
                    <p><span className="text-white">MRN:</span> {formData.mrn}</p>
                    <p><span className="text-white">Department:</span> {formData.department}</p>
                    <p><span className="text-white">Qualifications:</span> {formData.qualifications}</p>
                    {formData.selectedHospitals.length > 0 && (
                      <p>
                        <span className="text-white">Hospitals:</span>{' '}
                        {hospitals.filter(h => formData.selectedHospitals.includes(h.id)).map(h => h.name).join(', ')}
                      </p>
                    )}
                    {formData.selectedClinics.length > 0 && (
                      <p>
                        <span className="text-white">Clinics:</span>{' '}
                        {clinics.filter(c => formData.selectedClinics.includes(c.id)).map(c => c.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4 border-t border-white/10">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-6 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Previous
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {loading ? 'Registering...' : 'Register Doctor'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

AddDoctorFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default AddDoctorFormModal;
