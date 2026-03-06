import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/authApi';
import { SignInPage } from '../components/ui/sign-in';
const testimonials = [
  {
    avatarSrc: "https://randomuser.me/api/portraits/women/57.jpg",
    name: "Dr. Sarah Chen",
    handle: "@sarahchen_md",
    text: "MedSync has transformed how our hospital manages patient flow and emergency coordination."
  },
  {
    avatarSrc: "https://randomuser.me/api/portraits/men/64.jpg",
    name: "Dr. Marcus Patel",
    handle: "@marcuspatel",
    text: "Real-time ambulance tracking and doctor scheduling in one place. Incredible platform."
  },
];

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {    e.preventDefault();
    const res = await loginUser(username, password);
    if (res.status === 'success' && res.role === 'admin') {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userRole', res.role);
      localStorage.setItem('userId', res.user_id);
      localStorage.setItem('userName', res.first_name);
      navigate('/admin-dashboard');
    } else {
      setMsg(res.message);
    }
  };

  return (
    <SignInPage
      heroImageSrc="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=1600&q=80"
      testimonials={testimonials}
      onSignIn={handleSubmit}
      errorMsg={msg}
      username={username}
      setUsername={setUsername}
      password={password}
      setPassword={setPassword}
      onCreateAccount={() => navigate('/register')}
    />
  );
}

export default Login;
