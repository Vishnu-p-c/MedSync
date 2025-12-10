import logo from "../assets/logo.svg";


function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 ">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-x2 px-10 py-8 ">
        
        <div className="mb-8">
          <div className="mb-4">
            <img src={logo} 
            alt="Logo"
            className="h-26 w-auto mx-auto mb-4 " />
          </div>

         <h1 className="text-3xl font-extrabold text-slate-900 ">Login</h1>
        </div>


        <form className="flex flex-col gap-4">
          <div className="flex flex-col ">
            <label className="text-sm text-slate-600 mb-1">  
            UserName</label>
            <input type="text" placeholder="Enter UserName" className="border-b border-slate-400 bg-transparent py-1 focus:outline-none focus:border-blue-600 text-slate-900 " />   
          </div>

          <div className="flex flex-col"> 
            <label className="text-sm text-slate-600 mb-1">Password</label>
            <input type="password" name="pass" placeholder="Enter password" className="border-b border-slate-400 bg-transparent py-1 focus:outline-none focus:border-blue-600 text-slate-900 " />
          </div>
          <button type="submit" className="mt-4 w-full py-3 bg-blue-500 rounded-full text-white font-semibold hover:bg-blue-600 active:scale-[0.98] transition-transform">Login</button>

        </form>

      </div>

    </div>


  );
}

export default Login;
