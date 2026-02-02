import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { loginUser } from '../api/authApi';

import GlassSurface from '../components/GlassSurface/GlassSurface';




function Login() {
  
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const[msg,setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await loginUser(username,password);
    if (res.status === "success" && res.role === 'admin'){
      // Store authentication state in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', res.role);
      localStorage.setItem('userId', res.user_id);
      localStorage.setItem('userName', res.first_name);
      navigate('/admin-dashboard');
    }
    else {
      setMsg(res.message);
      

    }

  };


  return (
  
    <div className="min-h-screen flex bg-[#030B12]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative items-center justify-center overflow-hidden bg-[#030B12]">
        {/* Background - solid dark */}
        <div className="absolute inset-0 bg-[#030B12]"></div>
        
        {/* Subtle glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/3 rounded-full blur-3xl"></div>
        
        {/* MedSync Branding with ECG Line */}
        <div className="relative z-10 flex flex-col items-center justify-center px-12">
          {/* ECG Line with MedSync Text */}
          <svg 
            viewBox="0 0 750 180" 
            className="w-full max-w-3xl"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Glow filter */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.2"/>
                <stop offset="20%" stopColor="#00d4ff" stopOpacity="1"/>
                <stop offset="80%" stopColor="#00d4ff" stopOpacity="1"/>
                <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.2"/>
              </linearGradient>
            </defs>
            
            {/* ECG heartbeat line */}
            <path 
              d="M 0 90 
                 L 60 90 
                 L 85 90 
                 L 105 65 
                 L 125 115 
                 L 145 30 
                 L 165 150 
                 L 185 70 
                 L 205 90 
                 L 230 90"
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="4"
              filter="url(#glow)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* MedSync Text - Larger */}
            <text 
              x="245" 
              y="110" 
              fill="#00d4ff" 
              fontSize="80" 
              fontFamily="Arial, sans-serif" 
              fontWeight="bold"
              filter="url(#glow)"
            >
              MedSync
            </text>
            
            {/* Continuing line after text */}
            <path 
              d="M 545 90 L 750 90"
              fill="none" 
              stroke="url(#lineGradient)" 
              strokeWidth="4"
              filter="url(#glow)"
              strokeLinecap="round"
            />
          </svg>
          
          {/* Tagline - Larger */}
          <p className="mt-12 text-cyan-400/80 text-2xl tracking-widest font-light">
            Healthcare Management System
          </p>
          
          {/* Decorative elements */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
        </div>
        
        {/* Corner decorations */}
        <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-cyan-500/15 rounded-tl-lg"></div>
        <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-cyan-500/15 rounded-br-lg"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <GlassSurface
          className="w-full max-w-md px-8 sm:px-10 py-10 sm:py-12"
          borderRadius={24}
          borderWidth={0.07}
          blur={11}
          saturation={1}
          backgroundOpacity={0.15}
          displace={0.5}
          distortionScale={-180}
          redOffset={0}
          greenOffset={10}
          blueOffset={20}
          brightness={50}
          opacity={0.93}
          mixBlendMode="difference"
        >
          {/* Mobile Logo - Only shows on small screens */}
          <div className="lg:hidden mb-8 flex justify-center">
            <svg viewBox="0 0 300 60" className="w-48">
              <defs>
                <filter id="glowMobile" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <path 
                d="M 0 30 L 20 30 L 30 20 L 40 40 L 50 10 L 60 50 L 70 25 L 80 30 L 90 30"
                fill="none" 
                stroke="#00d4ff" 
                strokeWidth="2"
                filter="url(#glowMobile)"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <text x="95" y="38" fill="#00d4ff" fontSize="28" fontFamily="Arial, sans-serif" fontWeight="bold" filter="url(#glowMobile)">MedSync</text>
              <path d="M 220 30 L 300 30" fill="none" stroke="#00d4ff" strokeWidth="2" filter="url(#glowMobile)" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/50 text-sm">Sign in to continue to your dashboard</p>
          </div>


          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="text-sm text-white/70 mb-2">Username</label>
              <input 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                type="text" 
                placeholder="Enter Username" 
                className="border-b-2 border-white/20 bg-transparent py-2 focus:outline-none focus:border-cyan-400/60 text-white placeholder-white/30 text-base transition-colors" 
              /> 
              {msg && <span className='text-sm text-red-400 mt-2'>{msg}</span>}
            </div>

            <div className="flex flex-col"> 
              <label className="text-sm text-white/70 mb-2">Password</label>
              <input 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                type="password" 
                placeholder="Enter Password" 
                className="border-b-2 border-white/20 bg-transparent py-2 focus:outline-none focus:border-cyan-400/60 text-white placeholder-white/30 text-base transition-colors" 
              />
            </div>
            
            <button 
              type="submit" 
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold hover:from-cyan-400 hover:to-blue-400 active:scale-[0.98] transition-all shadow-lg shadow-cyan-500/25 text-base"
            >
              Sign In
            </button>

          </form>

        </GlassSurface>
      </div>
    </div>

  );
}

export default Login;
