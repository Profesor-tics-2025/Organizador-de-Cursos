import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import { api } from '../../lib/api';

export function Auth({ onLogin }: { onLogin: (user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      let res;
      if (isLogin) {
        res = await api.login({ email, password });
      } else {
        res = await api.register({ email, password, name });
      }
      localStorage.setItem('token', res.token);
      onLogin(res.user);
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center p-4"
      style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.8), rgba(255,255,255,0.8)), url(https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop)' }}
    >
      <div className="bg-white/0 backdrop-blur-lg p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-white/30">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white/20 rounded-2xl">
            <GraduationCap className="w-12 h-12 text-emerald-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-[#8e00ff] mb-2">DocentePro</h1>
        <p className="text-[#8e00ff] mb-8">Gestión profesional para docentes freelance.</p>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#8f85fa] bg-white/10 text-[#8f85fa] placeholder-[#8f85fa]/70 focus:ring-2 focus:ring-[#8f85fa] outline-none"
              required
            />
          )}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#8f85fa] bg-white/10 text-[#8f85fa] placeholder-[#8f85fa]/70 focus:ring-2 focus:ring-[#8f85fa] outline-none"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#8f85fa] bg-white/10 text-[#8f85fa] placeholder-[#8f85fa]/70 focus:ring-2 focus:ring-[#8f85fa] outline-none"
            required
          />
          <button
            type="submit"
            className="w-full py-3 bg-[#8f85fa] text-white font-semibold rounded-xl hover:bg-[#7a70e0] transition-all border border-[#8f85fa]"
          >
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="mt-6 text-sm text-[#8f85fa] hover:text-[#7a70e0]"
        >
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </div>
    </div>
  );
}
