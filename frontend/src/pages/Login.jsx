import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { loginUser } from '../api/authApi';

import logo from "../assets/logo.svg";
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
      navigate('/admin-dashboard');
    }
    else {
      setMsg(res.message);
      

    }

  };


  return (
    <DashboardLayout>
    <div className="min-h-screen flex items-center justify-center bg-gray-300   " >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-zinc-800 px-10 py-8 ">
        
        <div className="mb-8">
          <div>
            <img src={logo} alt="Logo" className="w-16 h-18 mx-auto mb-5" />
          </div>
         <h1 className="text-3xl font-extrabold text-slate-900 ">Login</h1>
        </div>


        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col ">
            <label className="text-sm text-slate-600 mb-1">  
            UserName</label>
            <input value={username} onChange={e => setUsername(e.target.value)} type="text" placeholder="Enter UserName" className="border-b border-slate-400 bg-transparent py-1 focus:outline-none focus:border-blue-600 text-slate-900 " /> 
            <span className='text-sm text-red-500 py-1'>{msg}</span>  
          </div>

          <div className="flex flex-col"> 
            <label className="text-sm text-slate-600 mb-1">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" name="pass" placeholder="Enter password" className="border-b border-slate-400 bg-transparent py-1 focus:outline-none focus:border-blue-600 text-slate-900 " />
          </div>
          <button type="submit" className="mt-4 w-full py-3 bg-blue-500 rounded-full text-white font-semibold hover:bg-blue-600 active:scale-[0.98] transition-transform">Login</button>

        </form>

      </div>

    </div>

  </DashboardLayout>
  );
}

export default Login;
