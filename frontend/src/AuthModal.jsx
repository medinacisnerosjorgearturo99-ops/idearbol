import React, { useState, useEffect } from 'react';
// Añadimos Loader2 para el icono de "Cargando"
import { X, Mail, Lock, User, AtSign, AlertCircle, LogIn, UserPlus, Loader2 } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onLoginSuccess }) {
  const [mode, setMode] = useState(initialMode);
  
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  // NUEVO: Estado para saber si estamos esperando respuesta del servidor
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError('');
    setPassword('');
    setConfirmPassword('');
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // NUEVO: Función asíncrona para comunicarnos con el Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true); // Encendemos el icono de carga

    try {
      if (mode === 'register') {
        // Validaciones locales rápidas
        if (!name || !username || !email || !password) {
          setIsLoading(false);
          return setError('Todos los campos son obligatorios.');
        }
        if (password !== confirmPassword) {
          setIsLoading(false);
          return setError('Las contraseñas no coinciden.');
        }

        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        // Petición POST al Backend (Registro)
        const response = await fetch('https://idearbol.onrender.com/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, username, email, password, initials })
        });

        const data = await response.json();

        // Si el servidor responde con un error (ej. correo ya existe)
        if (!response.ok) throw new Error(data.message || 'Error al registrar usuario');

        // Éxito
        onLoginSuccess(data.user);
        onClose();

      } else {
        // Validaciones locales
        if (!email || !password) {
          setIsLoading(false);
          return setError('Ingresa tu usuario/correo y contraseña.');
        }
        
        // Petición POST al Backend (Login)
        const response = await fetch('https://idearbol.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.message || 'Credenciales incorrectas');

        // Éxito
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (err) {
      // Mostrar el error que viene del backend
      setError(err.message);
    } finally {
      setIsLoading(false); // Apagamos el icono de carga
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#141923] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#1A212E]">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            {mode === 'login' ? <LogIn size={20} className="text-indigo-400" /> : <UserPlus size={20} className="text-indigo-400" />}
            {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h2>
          <button onClick={onClose} disabled={isLoading} className="text-slate-500 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" disabled={isLoading} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Nombre de Usuario</label>
                <div className="relative">
                  <AtSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="text" disabled={isLoading} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="juanperez99" className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
              {mode === 'login' ? 'Correo o Usuario' : 'Correo Electrónico'}
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type={mode === 'register' ? 'email' : 'text'} disabled={isLoading} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={mode === 'login' ? "usuario o correo@ejemplo.com" : "correo@ejemplo.com"} className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="password" disabled={isLoading} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
            </div>
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="password" disabled={isLoading} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#0B0F17] border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50" />
              </div>
            </div>
          )}

          <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white py-3 rounded-lg font-medium shadow-lg shadow-indigo-500/20 transition-all mt-4 flex items-center justify-center gap-2">
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {mode === 'login' ? 'Ingresar a mi cuenta' : 'Comenzar a idear'}
          </button>
        </form>

        <div className="p-4 bg-[#0B0F17]/50 border-t border-slate-800 text-center text-sm text-slate-400">
          {mode === 'login' ? (
            <p>¿No tienes cuenta? <button type="button" disabled={isLoading} onClick={() => { setMode('register'); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50">Regístrate aquí</button></p>
          ) : (
            <p>¿Ya tienes cuenta? <button type="button" disabled={isLoading} onClick={() => { setMode('login'); setError(''); }} className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50">Inicia sesión</button></p>
          )}
        </div>
      </div>
    </div>
  );
}