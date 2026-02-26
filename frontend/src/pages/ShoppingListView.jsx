import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Check, Trash2, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function ShoppingListView() {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState('');
    const [loading, setLoading] = useState(true);

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchItems = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/items`, getAuthHeader());
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const addItem = async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        try {
            // Optimistic update
            const optimisticItem = { id: Date.now().toString(), content: newItem, isCompleted: false };
            setItems(prev => [...prev, optimisticItem]);
            setNewItem('');

            await axios.post(`${API_URL}/items`, { content: newItem }, getAuthHeader());
            fetchItems(); // Real sync
        } catch (err) {
            console.error(err);
            fetchItems(); // Revert on failure
        }
    };

    const toggleItem = async (id, currentStatus) => {
        try {
            // Optimistic update
            setItems(prev => prev.map(item => item.id === id ? { ...item, isCompleted: !currentStatus } : item));
            await axios.put(`${API_URL}/items/${id}`, {}, getAuthHeader());
        } catch (err) {
            console.error(err);
            fetchItems(); // Revert on failure
        }
    };

    const deleteCompleted = async () => {
        if (!window.confirm('¿Borrar todos los tachados?')) return;
        try {
            setItems(prev => prev.filter(item => !item.isCompleted));
            await axios.delete(`${API_URL}/items/completed`, getAuthHeader());
        } catch (err) {
            console.error(err);
            fetchItems();
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    const incompleteItems = items.filter(item => !item.isCompleted);
    const completeItems = items.filter(item => item.isCompleted);

    return (
        <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <form onSubmit={addItem} className="relative">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Agregar a la lista..."
                    className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                />
                <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>

            <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                    {incompleteItems.length === 0 ? (
                        <div className="p-8 text-center text-zinc-400 dark:text-zinc-500 text-sm">Todo comprado 🎉</div>
                    ) : (
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {incompleteItems.map(item => (
                                <li
                                    key={item.id}
                                    onClick={() => toggleItem(item.id, item.isCompleted)}
                                    className="p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors group"
                                >
                                    <div className="w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 group-hover:border-primary-500 dark:group-hover:border-primary-400 transition-colors flex items-center justify-center shrink-0" />
                                    <span className="text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-tight">{item.content}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {completeItems.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tachados</h2>
                            <button
                                onClick={deleteCompleted}
                                className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center gap-1"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Limpiar
                            </button>
                        </div>

                        <div className="bg-white/50 dark:bg-zinc-900/50 rounded-2xl border border-zinc-100/50 dark:border-zinc-800/50 overflow-hidden">
                            <ul className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50">
                                {completeItems.map(item => (
                                    <li
                                        key={item.id}
                                        onClick={() => toggleItem(item.id, item.isCompleted)}
                                        className="p-4 flex items-center gap-3 cursor-pointer hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 active:bg-zinc-100/80 dark:active:bg-zinc-800/50 transition-colors"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-primary-500 dark:bg-primary-600/50 text-white dark:text-primary-200 flex items-center justify-center shrink-0 shadow-sm">
                                            <Check className="w-4 h-4" />
                                        </div>
                                        <span className="text-zinc-400 dark:text-zinc-500 line-through decoration-zinc-300 dark:decoration-zinc-600 decoration-2">{item.content}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
