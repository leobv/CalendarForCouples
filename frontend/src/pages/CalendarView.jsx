import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, Loader2, Calendar as CalIcon, Clock, Stethoscope, Utensils, Plane, Dumbbell, Briefcase, Heart, Sparkles } from 'lucide-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const locales = {
    'es': es,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const API_URL = 'http://localhost:5000/api';

export default function CalendarView() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [view, setView] = useState('month');
    const [currentDate, setCurrentDate] = useState(new Date());

    const [editingEventId, setEditingEventId] = useState(null);
    const [newEvent, setNewEvent] = useState({ title: '', dateStart: '', time: '10:00', timeEnd: '' });
    const [errorMsg, setErrorMsg] = useState(null);

    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const fetchEvents = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/events`, getAuthHeader());
            setEvents(data);
        } catch (err) {
            if (err.response?.status !== 401) {
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const handleSaveEvent = async (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.dateStart) return;

        setErrorMsg(null);

        try {
            // Combine date and time
            const datetimeStart = new Date(`${newEvent.dateStart}T${newEvent.time}`);
            let datetimeEnd = null;
            if (newEvent.timeEnd) {
                datetimeEnd = new Date(`${newEvent.dateStart}T${newEvent.timeEnd}`);
                if (datetimeEnd <= datetimeStart) {
                    setErrorMsg("La hora de fin debe ser posterior a la de inicio.");
                    return;
                }
            }

            const payload = {
                title: newEvent.title,
                dateStart: datetimeStart.toISOString(),
                dateEnd: datetimeEnd ? datetimeEnd.toISOString() : null
            };

            if (editingEventId) {
                // Update existing
                await axios.put(`${API_URL}/events/${editingEventId}`, payload, getAuthHeader());
            } else {
                // Create new
                await axios.post(`${API_URL}/events`, payload, getAuthHeader());
            }

            closeModal();
            fetchEvents();
        } catch (err) {
            if (err.response?.status === 409) {
                setErrorMsg(err.response.data.message);
            } else {
                if (err.response?.status !== 401) console.error(err);
                setErrorMsg("Ocurrió un error al guardar el evento.");
            }
        }
    };

    const deleteEvent = async (id) => {
        if (!window.confirm('¿Borrar este evento?')) return;
        try {
            setEvents(prev => prev.filter(ev => ev.id !== id));
            await axios.delete(`${API_URL}/events/${id}`, getAuthHeader());
            closeModal();
        } catch (err) {
            console.error(err);
            fetchEvents();
        }
    };

    const openCreateModal = ({ start }) => {
        let initialDate = new Date();
        let initialTime = "10:00";
        let initialTimeEnd = "";
        if (start) {
            initialDate = start;
            initialTime = format(start, 'HH:mm');
        }
        setEditingEventId(null);
        setNewEvent({ title: '', dateStart: format(initialDate, 'yyyy-MM-dd'), time: initialTime, timeEnd: initialTimeEnd });
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    const openEditModal = (calEvent) => {
        const ev = calEvent.originalEvent;
        const d = parseISO(ev.dateStart);
        const dEnd = ev.dateEnd ? parseISO(ev.dateEnd) : null;
        setEditingEventId(ev.id);
        setNewEvent({
            title: ev.title,
            dateStart: format(d, 'yyyy-MM-dd'),
            time: format(d, 'HH:mm'),
            timeEnd: dEnd ? format(dEnd, 'HH:mm') : ''
        });
        setErrorMsg(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingEventId(null);
        setNewEvent({ title: '', dateStart: '', time: '10:00', timeEnd: '' });
        setErrorMsg(null);
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-zinc-400" /></div>;

    // Transform events for react-big-calendar
    const calendarEvents = events.map(ev => {
        const start = parseISO(ev.dateStart);
        const end = ev.dateEnd ? parseISO(ev.dateEnd) : new Date(start.getTime() + 60 * 60 * 1000);
        return {
            id: ev.id,
            title: ev.title,
            creatorName: ev.creator?.name || 'Invitado',
            start,
            end,
            originalEvent: ev
        };
    });

    const getEventStyle = (title) => {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('médico') || lowerTitle.includes('doctor') || lowerTitle.includes('salud') || lowerTitle.includes('turno')) {
            return { bg: 'bg-emerald-500', icon: <Stethoscope className="w-3.5 h-3.5" /> };
        }
        if (lowerTitle.includes('cena') || lowerTitle.includes('almuerzo') || lowerTitle.includes('comida') || lowerTitle.includes('restaurante')) {
            return { bg: 'bg-orange-500', icon: <Utensils className="w-3.5 h-3.5" /> };
        }
        if (lowerTitle.includes('viaje') || lowerTitle.includes('vuelo') || lowerTitle.includes('aeropuerto')) {
            return { bg: 'bg-sky-500', icon: <Plane className="w-3.5 h-3.5" /> };
        }
        if (lowerTitle.includes('gym') || lowerTitle.includes('entrenamiento') || lowerTitle.includes('deporte') || lowerTitle.includes('padel') || lowerTitle.includes('fútbol')) {
            return { bg: 'bg-indigo-500', icon: <Dumbbell className="w-3.5 h-3.5" /> };
        }
        if (lowerTitle.includes('trabajo') || lowerTitle.includes('reunión') || lowerTitle.includes('oficina')) {
            return { bg: 'bg-slate-700', icon: <Briefcase className="w-3.5 h-3.5" /> };
        }
        if (lowerTitle.includes('cita') || lowerTitle.includes('aniversario') || lowerTitle.includes('amor')) {
            return { bg: 'bg-rose-500', icon: <Heart className="w-3.5 h-3.5" /> };
        }
        // Default style
        return { bg: 'bg-primary-500', icon: <Sparkles className="w-3.5 h-3.5" /> };
    };

    const CustomEvent = ({ event }) => {
        const { bg, icon } = getEventStyle(event.title);
        return (
            <div className={`p-1 px-1.5 h-full w-full rounded-md text-white shadow-sm flex items-center gap-1.5 overflow-hidden transition-all hover:brightness-110 ${bg}`}>
                <div className="shrink-0 drop-shadow-sm opacity-90">{icon}</div>
                <div className="flex flex-col min-w-0 leading-tight">
                    <span className="text-xs font-semibold truncate drop-shadow-sm">{event.title}</span>
                    <span className="text-[9px] opacity-85 truncate">de {event.creatorName}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 pb-24 h-[calc(100vh-5rem)] flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex-1 bg-white dark:bg-zinc-950 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 shadow-sm mt-2 overflow-hidden">
                <style>{`
                    .rbc-calendar { font-family: inherit; }
                    .rbc-btn-group button { border-radius: 8px !important; margin: 0 2px; }
                    .rbc-active { background-color: var(--color-primary-100) !important; color: var(--color-primary-700) !important; font-weight: 500;}
                    .rbc-toolbar button:active, .rbc-toolbar button.rbc-active:hover, .rbc-toolbar button:focus { box-shadow: none; }
                    .rbc-event { background-color: transparent !important; border: none !important; padding: 0 !important; }
                    .rbc-event-label { display: none; }
                `}</style>
                <Calendar
                    localizer={localizer}
                    events={calendarEvents}
                    components={{
                        event: CustomEvent
                    }}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    culture="es"
                    messages={{
                        today: 'Hoy',
                        previous: '<',
                        next: '>',
                        month: 'Mes',
                        week: 'Semana',
                        day: 'Día',
                        agenda: 'Agenda',
                        date: 'Fecha',
                        time: 'Hora',
                        event: 'Evento',
                        noEventsInRange: 'No hay eventos en este rango.',
                    }}
                    view={view}
                    onView={(newView) => setView(newView)}
                    date={currentDate}
                    onNavigate={(newDate) => setCurrentDate(newDate)}
                    onSelectEvent={openEditModal}
                    onSelectSlot={openCreateModal}
                    selectable
                />
            </div>

            {/* FAB Add Button */}
            <button
                onClick={() => openCreateModal({})}
                className="fixed bottom-[88px] right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg shadow-primary-600/30 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-40"
            >
                <Plus className="w-6 h-6" />
            </button>

            {/* Add/Edit Event Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-3xl p-6 shadow-xl border border-transparent dark:border-zinc-800 animate-in slide-in-from-bottom-8 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                                {editingEventId ? 'Editar evento' : 'Nuevo evento'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                                {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSaveEvent} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1.5 ml-1">Título</label>
                                <input
                                    type="text"
                                    placeholder="Ej. Turno del médico, Cena, etc."
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all placeholder:text-zinc-400"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Fecha</label>
                                    <input
                                        type="date"
                                        value={newEvent.dateStart}
                                        onChange={(e) => setNewEvent({ ...newEvent, dateStart: e.target.value })}
                                        className="w-full px-3 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:border-primary-500 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Inicio</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                        className="w-full px-3 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:border-primary-500 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5 ml-1">Fin (Opcional)</label>
                                    <input
                                        type="time"
                                        value={newEvent.timeEnd}
                                        onChange={(e) => setNewEvent({ ...newEvent, timeEnd: e.target.value })}
                                        className="w-full px-3 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:bg-white dark:focus:bg-zinc-950 focus:border-primary-500 outline-none transition-all dark:text-zinc-100 placeholder:text-zinc-400"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-2">
                                {editingEventId && (
                                    <button
                                        type="button"
                                        onClick={() => deleteEvent(editingEventId)}
                                        className="py-3.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-all"
                                    >
                                        Borrar
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 px-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium rounded-xl shadow-sm transition-all"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
