import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { loginUser } from '../api/authApi';

import LiquidEtherBackground from '../components/LiquidEtherBackground';
import GlassSurface from '../components/GlassSurface/GlassSurface';

import logo from "../assets/logo.png";
import DashboardLayout from "../layout/DashboardLayout";




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
    <LiquidEtherBackground>
    <div className="min-h-screen flex items-center justify-center" >
      <GlassSurface
        className="w-full max-w-md px-10 py-8"
        borderRadius={24}
        borderWidth={0.07}
        blur={11}
        saturation={1}
        backgroundOpacity={0.1}
        displace={0.5}
        distortionScale={-180}
        redOffset={0}
        greenOffset={10}
        blueOffset={20}
        brightness={50}
        opacity={0.93}
        mixBlendMode="difference"
      >
        
        <div className="mb-8">
          <div>
            <img src={logo} alt="Logo" className="w-28 h-28 object-contain mx-auto mb-5" />
          </div>
         <h1 className="text-3xl font-extrabold text-white">Login</h1>
        </div>


        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col ">
            <label className="text-sm text-white/70 mb-1">  
            UserName</label>
            <input value={username} onChange={e => setUsername(e.target.value)} type="text" placeholder="Enter UserName" className="border-b border-white/25 bg-transparent py-1 focus:outline-none focus:border-white/60 text-white placeholder-white/40" /> 
            <span className='text-sm text-red-500 py-1'>{msg}</span>  
          </div>

          <div className="flex flex-col"> 
            <label className="text-sm text-white/70 mb-1">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" name="pass" placeholder="Enter password" className="border-b border-white/25 bg-transparent py-1 focus:outline-none focus:border-white/60 text-white placeholder-white/40" />
          </div>
          <button type="submit" className="mt-4 w-full py-3 bg-white/90 rounded-full text-black font-semibold hover:bg-white active:scale-[0.98] transition-transform">Login</button>

        </form>

      </GlassSurface>

    </div>
    </LiquidEtherBackground>
  );
}

export default Login;
