import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { resetPassword, verifyResetToken } from '../api/authApi';
import { Eye, EyeOff } from 'lucide-react';
import medsyncLogo from '../assets/20251216_131631.png';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(null); // null = checking, true/false

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    const check = async () => {
      const res = await verifyResetToken(token);
      setTokenValid(res.status === 'success');
    };
    check();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in both fields.');
      setIsSuccess(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters.');
      setIsSuccess(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    const res = await resetPassword(token, newPassword);

    setLoading(false);
    setMessage(res.message);
    setIsSuccess(res.status === 'success');
  };

  // Token checking state
  if (tokenValid === null) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#2196f3]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-white/50 text-sm">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!tokenValid) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a0a] px-4 relative">
        <Link to="/" className="absolute top-6 left-8">
          <img src={medsyncLogo} alt="MedSync" className="h-10 w-auto" />
        </Link>
        <div className="w-full max-w-md text-center flex flex-col gap-6">
          <div className="text-6xl">🔗</div>
          <h1 className="text-3xl font-semibold text-white">
            Invalid or Expired Link
          </h1>
          <p className="text-white/50 text-sm">
            This password reset link is no longer valid. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block rounded-2xl bg-[#2196f3] py-4 px-8 font-medium text-white hover:bg-[#1976d2] transition-colors"
          >
            Request New Link
          </Link>
          <Link to="/login" className="text-sm text-white/50 hover:text-[#2196f3] transition-colors">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#0a0a0a] px-4 relative">
      <Link to="/" className="absolute top-6 left-8">
        <img src={medsyncLogo} alt="MedSync" className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {isSuccess ? (
            /* Success state */
            <div className="text-center flex flex-col gap-6">
              <div className="text-6xl">✅</div>
              <h1 className="text-3xl font-semibold text-white">
                Password Reset!
              </h1>
              <p className="text-white/50 text-sm">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              <Link
                to="/login"
                className="inline-block rounded-2xl bg-[#2196f3] py-4 px-8 font-medium text-white hover:bg-[#1976d2] transition-colors"
              >
                Sign In
              </Link>
            </div>
          ) : (
            /* Reset form */
            <>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-white">
                <span className="font-light tracking-tighter">Reset Password</span>
              </h1>
              <p className="text-white/50 text-sm">
                Enter your new password below.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-white/60 block mb-1">
                    New Password
                  </label>
                  <div className="rounded-2xl border border-white/10 backdrop-blur-sm bg-white/5">
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder-white/30"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center"
                      >
                        {showPassword
                          ? <EyeOff className="w-5 h-5 text-white/40 hover:text-white transition-colors" />
                          : <Eye className="w-5 h-5 text-white/40 hover:text-white transition-colors" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-white/60 block mb-1">
                    Confirm Password
                  </label>
                  <div className="rounded-2xl border border-white/10 backdrop-blur-sm bg-white/5">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder-white/30"
                      disabled={loading}
                    />
                  </div>
                  {message && (
                    <span className="text-sm mt-2 block text-red-400">
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
                      Resetting...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-white/50">
                <Link
                  to="/login"
                  className="text-[#2196f3] hover:underline transition-colors font-medium"
                >
                  Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
