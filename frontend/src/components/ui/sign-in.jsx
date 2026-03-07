import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import medsyncLogo from '@/assets/20251216_131631.png';

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors focus-within:border-[#2196f3]/70 focus-within:bg-[#2196f3]/5">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-white/40">{testimonial.handle}</p>
      <p className="mt-1 text-white/70">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage = ({
  title = <span className="font-light text-white tracking-tighter">Welcome Back</span>,
  description = "Access your account and continue to MedSync",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  errorMsg = '',
  username,
  setUsername,
  password,
  setPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row w-[100dvw] bg-[#0a0a0a]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 relative">
        <Link to="/" className="absolute top-6 left-8">
          <img src={medsyncLogo} alt="MedSync" className="h-10 w-auto" />
        </Link>
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-white">
              {title}
            </h1>
            <p className="animate-element animate-delay-200 text-white/50">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-white/60 block mb-1">Username</label>
                <GlassInputWrapper>
                  <input
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder-white/30"
                  />
                </GlassInputWrapper>
                {errorMsg && <span className="text-sm text-red-400 mt-1 block">{errorMsg}</span>}
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-white/60 block mb-1">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder-white/30"
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
                </GlassInputWrapper>
                <div className="mt-1 text-right">
                  <Link to="/forgot-password" className="text-xs text-[#2196f3] hover:underline transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                className="animate-element animate-delay-500 w-full rounded-2xl bg-[#2196f3] py-4 font-medium text-white hover:bg-[#1976d2] transition-colors"
              >
                Sign In
              </button>
            </form>

            <p className="animate-element animate-delay-600 text-center text-sm text-white/50">
              New to MedSync?{' '}
              <button
                onClick={onCreateAccount}
                className="text-[#2196f3] hover:underline transition-colors font-medium"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center"
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          >
            <div className="absolute inset-0 rounded-3xl bg-[#0a0a0a]/40" />
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
