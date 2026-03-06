import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerAdmin } from '../api/authApi';
import { Eye, EyeOff } from 'lucide-react';
import medsyncLogo from '@/assets/20251216_131631.png';

const GlassInputWrapper = ({ children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors focus-within:border-[#2196f3]/70 focus-within:bg-[#2196f3]/5">
    {children}
  </div>
);

const inputClass = "w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder-white/30";

function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    password: '',
    hospital_id: '',
  });

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);

    const res = await registerAdmin(form);
    setLoading(false);

    if (res.status === 'success') {
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } else if (res.message === 'missing_fields') {
      setError(`Missing fields: ${res.missing?.join(', ')}`);
    } else if (res.message === 'hospital_not_found') {
      setError('Hospital ID not found. Please check and try again.');
    } else if (res.message === 'user_exists') {
      setError('Username or email already exists.');
    } else {
      setError(res.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-[#0a0a0a]">
      {/* Left: form */}
      <section className="flex-1 flex items-center justify-center p-8 relative">
        <Link to="/" className="absolute top-6 left-8">
          <img src={medsyncLogo} alt="MedSync" className="h-10 w-auto" />
        </Link>
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold text-white leading-tight">
                Create Account
              </h1>
              <p className="animate-element animate-delay-200 text-white/50 mt-2">
                Register as a hospital admin on MedSync
              </p>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-2xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-400">
                {success}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name row */}
              <div className="animate-element animate-delay-300 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/60 block mb-1">First Name</label>
                  <GlassInputWrapper>
                    <input type="text" placeholder="John" value={form.first_name} onChange={set('first_name')} className={inputClass} required />
                  </GlassInputWrapper>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/60 block mb-1">Last Name</label>
                  <GlassInputWrapper>
                    <input type="text" placeholder="Doe" value={form.last_name} onChange={set('last_name')} className={inputClass} />
                  </GlassInputWrapper>
                </div>
              </div>

              {/* Username */}
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-white/60 block mb-1">Username</label>
                <GlassInputWrapper>
                  <input type="text" placeholder="Choose a username" value={form.username} onChange={set('username')} className={inputClass} required />
                </GlassInputWrapper>
              </div>

              {/* Email */}
              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-white/60 block mb-1">Email</label>
                <GlassInputWrapper>
                  <input type="email" placeholder="admin@hospital.com" value={form.email} onChange={set('email')} className={inputClass} required />
                </GlassInputWrapper>
              </div>

              {/* Phone */}
              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-white/60 block mb-1">Phone</label>
                <GlassInputWrapper>
                  <input type="tel" placeholder="+91 9876543210" value={form.phone} onChange={set('phone')} className={inputClass} required />
                </GlassInputWrapper>
              </div>

              {/* DOB + Gender row */}
              <div className="animate-element animate-delay-400 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-white/60 block mb-1">Date of Birth</label>
                  <GlassInputWrapper>
                    <input type="date" value={form.date_of_birth} onChange={set('date_of_birth')} className={`${inputClass} [color-scheme:dark]`} required />
                  </GlassInputWrapper>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/60 block mb-1">Gender</label>
                  <GlassInputWrapper>
                    <select value={form.gender} onChange={set('gender')} className={`${inputClass} appearance-none bg-[#0a0a0a] [color-scheme:dark]`} required>
                      <option value="" disabled className="bg-[#0a0a0a] text-white/40">Select</option>
                      <option value="male" className="bg-[#0a0a0a] text-white">Male</option>
                      <option value="female" className="bg-[#0a0a0a] text-white">Female</option>
                      <option value="other" className="bg-[#0a0a0a] text-white">Other</option>
                    </select>
                  </GlassInputWrapper>
                </div>
              </div>

              {/* Hospital ID — text input to avoid native number spinners */}
              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-white/60 block mb-1">Hospital ID</label>
                <GlassInputWrapper>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Enter your hospital's ID" value={form.hospital_id} onChange={set('hospital_id')} className={inputClass} required />
                </GlassInputWrapper>
              </div>

              {/* Password */}
              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-white/60 block mb-1">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={form.password}
                      onChange={set('password')}
                      className={`${inputClass} pr-12`}
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword
                        ? <EyeOff className="w-5 h-5 text-white/40 hover:text-white transition-colors" />
                        : <Eye className="w-5 h-5 text-white/40 hover:text-white transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {/* Confirm Password */}
              <div className="animate-element animate-delay-500">
                <label className="text-sm font-medium text-white/60 block mb-1">Confirm Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showConfirmPassword
                        ? <EyeOff className="w-5 h-5 text-white/40 hover:text-white transition-colors" />
                        : <Eye className="w-5 h-5 text-white/40 hover:text-white transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="animate-element animate-delay-600 w-full rounded-2xl bg-[#2196f3] py-4 font-medium text-white hover:bg-[#1976d2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="animate-element animate-delay-700 text-center text-sm text-white/50">
              Already have an account?{' '}
              <button onClick={() => navigate('/login')} className="text-[#2196f3] hover:underline font-medium">
                Sign In
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right: hero image */}
      <section className="hidden md:block flex-1 relative p-4">
        <div
          className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1600&q=80)` }}
        >
          <div className="absolute inset-0 rounded-3xl bg-[#0a0a0a]/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-12">
            <h2 className="text-3xl font-semibold text-white mb-4">Join the MedSync Network</h2>
            <p className="text-white/60 max-w-sm leading-relaxed">
              Connect your hospital to a real-time healthcare management platform trusted by medical teams.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Register;
