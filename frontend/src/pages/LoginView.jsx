import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, AlertCircle, Loader2 } from 'lucide-react';

// En un entorno real se usaría VITE_API_URL
const API_URL = 'http://localhost:5000/api';

export default function LoginView() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', inviteCode: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLogin) {
                const { data } = await axios.post(`${API_URL}/auth/login`, { email: formData.email, password: formData.password });
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/');
            } else {
                const { data } = await axios.post(`${API_URL}/auth/register`, formData);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans animate-in fade-in duration-500">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl shadow-zinc-200/50 dark:shadow-zinc-900/50 border border-zinc-100 dark:border-zinc-800">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">Casa</h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Organiza tu vida en pareja</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-900/30 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                                placeholder="Tu nombre"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div className="pt-2">
                            <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2 ml-1">
                                Código de invitación (Opcional)
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                                placeholder="Dejar vacío para crear un espacio"
                                value={formData.inviteCode}
                                onChange={e => setFormData({ ...formData, inviteCode: e.target.value })}
                            />
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2 px-1">Si tu pareja ya creó la cuenta, pídele el código para unirte a su calendario.</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 px-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold rounded-xl shadow-sm shadow-primary-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-6"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            isLogin ? 'Ingresar a nuestro espacio' : 'Crear espacio'
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes una cuenta?"}
                        <button
                            type="button"
                            className="ml-2 font-semibold text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setFormData({ name: '', email: '', password: '', inviteCode: '' });
                            }}
                        >
                            {isLogin ? "Regístrate" : "Inicia sesión"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
