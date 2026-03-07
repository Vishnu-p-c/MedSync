import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/authApi';
import medsyncLogo from '../assets/20251216_131631.png';

function ForgotPassword() {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setMessage('Please enter your username or email.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    const res = await forgotPassword(identifier.trim());

    setLoading(false);
    setMessage(res.message);
    setIsSuccess(res.status === 'success');
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a0a] px-4 relative">
      {/* Logo */}
      <Link to="/" className="absolute top-6 left-8">
        <img src={medsyncLogo} alt="MedSync" className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white">
            <span className="font-light tracking-tighter">Forgot Password</span>
          </h1>
          <p className="text-white/50 text-sm">
            Enter your username or email address and we&apos;ll send you a link to reset your password.
          </p>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-white/60 block mb-1">
                Username or Email
              </label>
              <div className="rounded-2xl border border-white/10 backdrop-blur-sm bg-white/5">
                <input
                  type="text"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder-white/30"
                  disabled={loading}
                />
              </div>
              {message && (
                <span
                  className={`text-sm mt-2 block ${
                    isSuccess ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {message}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#2196f3] py-4 font-medium text-white hover:bg-[#1976d2] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/50">
            Remember your password?{' '}
            <Link
              to="/login"
              className="text-[#2196f3] hover:underline transition-colors font-medium"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
