import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReservationForm from './ReservationForm';
import PaymentSimulation from './PaymentSimulation';
import MyTickets from './MyTickets';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

// 1. DEFINIR LOS AVATARES (al inicio del componente, antes del Dashboard)
const AVATAR_SAMPLES = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", // Piloto
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", // Viajera
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Jack",  // Tripulante
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",// Pasajera
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Max"    // Turista
];

const Dashboard = ({ onLogout }) => {
    // ------------------------------------------------
    // Estado de Navegacion y Layout Responsivo
    // ------------------------------------------------
    const [currentView, setCurrentView] = useState('search');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // ------------------------------------------------
    // Estados para el formulario de busqueda
    // ------------------------------------------------
    const [airports, setAirports] = useState([]);
    const [originId, setOriginId] = useState('');
    const [destinationId, setDestinationId] = useState('');
    const [date, setDate] = useState(''); // Opcional
    const [time, setTime] = useState(''); // Opcional
    const [passengersCount, setPassengersCount] = useState(1);
    const [loadingAirports, setLoadingAirports] = useState(true);

    const [flights, setFlights] = useState([]);
    const [loadingFlights, setLoadingFlights] = useState(false);
    const [error, setError] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // ------------------------------------------------
    // Estados para la reserva (R2) y Pago (R3)
    // ------------------------------------------------
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [showReservationForm, setShowReservationForm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentReservationData, setCurrentReservationData] = useState(null);

    // ------------------------------------------------
    // Estados para el Perfil de Usuario (AGREGAR avatarIndex)
    // ------------------------------------------------
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({
        name: '',
        email: '',
        phone: '',
        savedCard: '',
        avatarIndex: 0 // Índice del avatar seleccionado
    });

    // ------------------------------------------------
    // Temporizador de inactividad (R8)
    // ------------------------------------------------
    const [lastActivity, setLastActivity] = useState(Date.now());
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutos en segundos

    const resetTimer = useCallback(() => {
        setLastActivity(Date.now());
        setTimeLeft(15 * 60); // Reiniciar a 15:00 si hay actividad
    }, []);

    useEffect(() => {
        // Eventos que se consideran "actividad"
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        return () => events.forEach(event => window.removeEventListener(event, resetTimer));
    }, [resetTimer]);

    useEffect(() => {
        const interval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - lastActivity) / 1000);
            const remainingSeconds = (15 * 60) - elapsedSeconds;

            if (remainingSeconds <= 0) {
                clearInterval(interval);
                localStorage.removeItem('token');
                alert("Tu sesión ha expirado por inactividad de 15 minutos.");
                onLogout();
            } else {
                setTimeLeft(remainingSeconds);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lastActivity, onLogout]);

    // Función para formatear los segundos a MM:SS
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ------------------------------------------------
    // Carga inicial de datos maestros y perfil
    // ------------------------------------------------
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    onLogout();
                    return;
                }

                // Cargar Aeropuertos
                const airportsRes = await axios.get(`${API_URL}/airports`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAirports(airportsRes.data);

                // Cargar Perfil 
                const profileRes = await axios.get(`${API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProfileData({
                    name: profileRes.data.name || '',
                    email: profileRes.data.email || '',
                    phone: profileRes.data.phone || '',
                    savedCard: profileRes.data.savedCard || '',
                    avatarIndex: profileRes.data.avatarIndex || 0
                });

            } catch (err) {
                console.error('Error al cargar datos iniciales:', err);
                if (err.response?.status === 401) onLogout();
            } finally {
                setLoadingAirports(false);
            }
        };

        fetchInitialData();
    }, [onLogout]);

    // ------------------------------------------------
    // Efecto para cargar vuelos "Preview" al iniciar
    // ------------------------------------------------
    useEffect(() => {
        const loadPreviewFlights = async () => {
            setLoadingFlights(true);
            try {
                const token = localStorage.getItem('token');
                // CAMBIO AQUÍ: Usamos /flights en lugar de /flights/search
                const response = await axios.get(`${API_URL}/flights`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFlights(response.data);
            } catch (err) {
                console.error('Error cargando preview de vuelos:', err);
            } finally {
                setLoadingFlights(false);
            }
        };

        loadPreviewFlights();
    }, []);

    // ------------------------------------------------
    // Manejador de Busqueda (Filtros Opcionales Corregidos)
    // ------------------------------------------------
    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        setLoadingFlights(true);
        setError('');
        setFlights([]);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Sesion expirada');

            // 1. OBTENEMOS TODOS LOS VUELOS (Quitamos el /search del final)
            const response = await axios.get(`${API_URL}/flights`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let resultados = response.data;

            // 2. FILTROS LOCALES A PRUEBA DE BALAS
            if (originId) {
                resultados = resultados.filter(f => f.originAirportId.toString() === originId.toString());
            }
            if (destinationId) {
                resultados = resultados.filter(f => f.destinationAirportId.toString() === destinationId.toString());
            }
            if (date && date.trim() !== '') {
                // Filtra por el día exacto seleccionado
                resultados = resultados.filter(f => f.departureTime.startsWith(date));
            }
            if (time && time.trim() !== '') {
                // "Lógica Colombiana": Si buscas a las 08:00, muestra vuelos de las 08:00 en adelante
                resultados = resultados.filter(f => {
                    const flightTimeStr = new Date(f.departureTime).toLocaleTimeString('es-CO', {
                        hour: '2-digit', minute: '2-digit', hour12: false
                    });
                    return flightTimeStr >= time;
                });
            }

            setFlights(resultados);
        } catch (err) {
            console.error('Error en busqueda:', err);
            setError('Error al procesar la búsqueda. Intenta de nuevo.');
            if (err.response?.status === 401) onLogout();
        } finally {
            setLoadingFlights(false);
        }
    }, [originId, destinationId, date, time, passengersCount, onLogout]);

    const handleReserveClick = useCallback((flight) => {
        setSelectedFlight(flight);
        setShowReservationForm(true);
    }, []);


    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.put(`${API_URL}/users/me`, {
                name: profileData.name,
                phone: profileData.phone,
                savedCard: profileData.savedCard,
                avatarIndex: profileData.avatarIndex
            }, { headers: { Authorization: `Bearer ${token}` } });
            setIsEditingProfile(false);
        } catch (error) {
            console.error("Error guardando el perfil", error);
        }
    };

    const handleDeactivate = async () => {
        if (window.confirm("¿Deseas desactivar tu cuenta? Podrás reactivarla contactando a soporte.")) {
            try {
                const token = localStorage.getItem('token');
                await axios.patch(`${API_URL}/users/me/deactivate`, {}, { // Llamamos a una nueva ruta /deactivate
                    headers: { Authorization: `Bearer ${token}` }
                });

                alert("Cuenta desactivada correctamente.");
                localStorage.removeItem('token');
                onLogout();
            } catch (error) {
                console.error("Error desactivando cuenta", error);
                alert("No se pudo desactivar la cuenta.");
            }
        }
    };

    // Función para eliminar
    const handleDelete = async () => {
        if (window.confirm("¡ADVERTENCIA! ¿Estás seguro de eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.")) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                localStorage.removeItem('token');
                onLogout();
            } catch (error) {
                console.error("Error eliminando cuenta", error);
                alert("Hubo un error al eliminar la cuenta.");
            }
        }
    };

    const changeView = (view) => {
        setCurrentView(view);
        setIsSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">

            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 w-64 bg-[#2A3F45] text-white flex flex-col shadow-2xl z-30 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
                <div className="p-6 text-center border-b border-white/10 relative">
                    <button onClick={() => setIsSidebarOpen(false)} className="absolute top-4 right-4 md:hidden text-gray-300 hover:text-white">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                    {/* ACTUALIZAR: Mostrar avatar seleccionado en la sidebar */}
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden border-2 border-[#E5B869] shadow-lg">
                        <img
                            src={AVATAR_SAMPLES[profileData.avatarIndex]}
                            alt="avatar"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <h2 className="text-xl font-bold text-[#E5B869]">Intouch Airlines</h2>
                    <p className="text-xs text-gray-400 mt-1">Terminal de Reservas</p>

                    {/* RELOJ DE INACTIVIDAD */}
                    <div className={`mx-auto w-fit flex items-center gap-2 px-3 py-1.5 rounded-full border ${timeLeft < 60
                        ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' // Se pone rojo parpadeante en el último minuto
                        : 'bg-black/20 border-white/10 text-gray-300'
                        }`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="text-sm font-mono font-medium">{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <button onClick={() => changeView('search')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${currentView === 'search' ? 'bg-[#E5B869] text-[#2A3F45] font-bold shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        Buscar Vuelos
                    </button>
                    <button onClick={() => changeView('tickets')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${currentView === 'tickets' ? 'bg-[#E5B869] text-[#2A3F45] font-bold shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                        Mis Tickets
                    </button>
                    <button onClick={() => changeView('profile')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 ${currentView === 'profile' ? 'bg-[#E5B869] text-[#2A3F45] font-bold shadow-md' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Mi Perfil
                    </button>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button onClick={() => { localStorage.removeItem('token'); onLogout(); }} className="w-full py-3 text-sm bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center gap-2 font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Cerrar Sesion
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden bg-white shadow-sm px-4 py-3 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-[#E5B869]">
                            <img
                                src={AVATAR_SAMPLES[profileData.avatarIndex]}
                                alt="avatar"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <h1 className="text-lg font-bold text-[#2A3F45]">Intouch Airlines</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600 hover:text-[#2A3F45] focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-gray-50 w-full">
                    {currentView === 'search' && (
                        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#2A3F45] mb-6 md:mb-8 border-b pb-4">Encuentra tu proximo destino</h1>

                            <form onSubmit={handleSearch} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                                    <div className="lg:col-span-1">
                                        <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-2">Origen</label>
                                        <select id="origin" value={originId} onChange={(e) => setOriginId(e.target.value)} disabled={loadingAirports} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none disabled:bg-gray-50 transition-all">
                                            <option value="">Cualquier origen</option>
                                            {airports.map((airport) => (
                                                <option key={airport.id} value={airport.id}>{airport.city} ({airport.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="lg:col-span-1">
                                        <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-2">Destino</label>
                                        <select id="destination" value={destinationId} onChange={(e) => setDestinationId(e.target.value)} disabled={loadingAirports} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none disabled:bg-gray-50 transition-all">
                                            <option value="">Cualquier destino</option>
                                            {airports.map((airport) => (
                                                <option key={airport.id} value={airport.id}>{airport.city} ({airport.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Fecha y Hora ahora son visualmente opcionales y sin atributos 'required' */}
                                    <div className="lg:col-span-1">
                                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">Fecha (Opcional)</label>
                                        <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none transition-all" />
                                    </div>

                                    <div className="lg:col-span-1">
                                        <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">Hora (Opcional)</label>
                                        <input type="time" id="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none transition-all" />
                                    </div>

                                    <div className="lg:col-span-1">
                                        <label htmlFor="passengers" className="block text-sm font-medium text-gray-700 mb-2">Pasajeros</label>
                                        <input type="number" id="passengers" value={passengersCount} onChange={(e) => setPassengersCount(Math.max(1, parseInt(e.target.value) || 1))} min="1" max="10" required className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none transition-all" />
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end">
                                    <button type="submit" disabled={loadingFlights || loadingAirports} className="w-full md:w-auto px-8 py-3 bg-[#2A3F45] text-white rounded-lg hover:bg-[#1f2e33] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md">
                                        {loadingFlights ? 'Buscando...' : 'Buscar vuelos'}
                                    </button>
                                </div>
                            </form>

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-8 shadow-sm">
                                    <p className="font-medium">{error}</p>
                                </div>
                            )}


                            {/* Título de resultados (solo si hay vuelos) */}
                            {!loadingFlights && !error && flights.length > 0 && (
                                <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-2">
                                    <h2 className="text-xl font-bold text-[#2A3F45]">Vuelos Disponibles</h2>
                                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                        {flights.length} resultados encontrados
                                    </span>
                                </div>
                            )}


                            {/* Titulo de Vuelos Disponibles */}
                            {!loadingFlights && !error && flights.length === 0 ? (
                                <div className="text-center py-12 md:py-16 bg-white rounded-xl border border-gray-100 shadow-sm px-4">
                                    <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                    <p className="text-gray-500 font-medium text-lg">No hay vuelos disponibles para esta ruta.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {flights.map((flight) => (
                                        <div key={flight.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                            <div className="bg-[#2A3F45] px-5 py-3 flex justify-between items-center">
                                                <span className="text-white font-semibold tracking-wide text-sm">{flight.airline?.name || 'Aerolinea'}</span>
                                                <span className="text-[#E5B869] text-xs font-bold px-2 py-1 bg-white/10 rounded">{flight.totalSeats} ASIENTOS LIBRES</span>
                                            </div>

                                            <div className="p-5 flex-1 flex flex-col">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="text-center">
                                                        <p className="text-xl md:text-2xl font-bold text-gray-800">{flight.origin?.code}</p>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{flight.origin?.city}</p>
                                                    </div>
                                                    <div className="flex-1 px-2 md:px-4 relative flex items-center justify-center">
                                                        <div className="w-full border-t-2 border-dashed border-gray-200"></div>
                                                        <svg className="w-5 h-5 text-gray-300 absolute bg-white px-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xl md:text-2xl font-bold text-gray-800">{flight.destination?.code}</p>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{flight.destination?.city}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 rounded-lg p-3 flex justify-between text-sm text-gray-600 mb-6">
                                                    <div>
                                                        <p className="text-xs text-gray-400 mb-1">Salida</p>
                                                        <p className="font-semibold text-gray-700">
                                                            {new Date(flight.departureTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </p>
                                                        <p className="text-xs font-medium text-gray-500 mt-1">{new Date(flight.departureTime).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-400 mb-1">Llegada</p>
                                                        <p className="font-semibold text-gray-700">
                                                            {new Date(flight.arrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </p>
                                                        <p className="text-xs font-medium text-gray-500 mt-1">{new Date(flight.arrivalTime).toLocaleDateString()}</p>
                                                    </div>
                                                </div>

                                                <div className="mt-auto border-t border-gray-100 pt-4 flex flex-col md:flex-row justify-between md:items-end gap-4 md:gap-0">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Tarifa final x {passengersCount}</p>
                                                        <p className="text-2xl font-bold text-green-600">${(flight.price * passengersCount).toLocaleString()}</p>
                                                    </div>
                                                    <button onClick={() => handleReserveClick(flight)} className="w-full md:w-auto px-6 py-2.5 bg-[#E5B869] text-[#2A3F45] rounded-lg hover:bg-[#d4a556] transition-colors text-sm font-bold shadow-sm">
                                                        Reservar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {currentView === 'tickets' && (
                        <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#2A3F45] mb-6 md:mb-8 border-b pb-4">
                                Mis Billetes Adquiridos
                            </h1>
                            <MyTickets />
                        </div>
                    )}

                    {currentView === 'profile' && (
                        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-2xl md:text-3xl font-bold text-[#2A3F45] mb-6 md:mb-8 border-b pb-4">Configuracion de Perfil</h1>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="bg-[#2A3F45] h-32 relative">
                                    <div className="absolute -bottom-12 left-8">
                                        <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                                            <div className="w-full h-full rounded-full overflow-hidden">
                                                <img
                                                    src={AVATAR_SAMPLES[profileData.avatarIndex]}
                                                    alt="avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-16 p-8">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-800">{profileData.name}</h2>
                                            <p className="text-gray-500">{profileData.email}</p>
                                        </div>
                                        <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                            {isEditingProfile ? 'Cancelar Edicion' : 'Editar Perfil'}
                                        </button>
                                    </div>
                                    {isEditingProfile ? (
                                        <form onSubmit={handleProfileUpdate} className="space-y-4">
                                            {/* Selector de avatares */}
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                                    Selecciona tu avatar
                                                </label>
                                                <div className="flex gap-4 justify-center">
                                                    {AVATAR_SAMPLES.map((url, index) => (
                                                        <img
                                                            key={index}
                                                            src={url}
                                                            alt="avatar"
                                                            onClick={() => setProfileData({ ...profileData, avatarIndex: index })}
                                                            className={`w-12 h-12 rounded-full cursor-pointer border-2 transition-all ${profileData.avatarIndex === index ? 'border-[#E5B869] scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                                                                }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                                <input type="text" value={profileData.name} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none" required />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                                                    <input type="text" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="Ej: 300 123 4567" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tarjeta de Credito Guardada (Simulacion)</label>
                                                    <input type="text" value={profileData.savedCard} onChange={(e) => setProfileData({ ...profileData, savedCard: e.target.value })} placeholder="0000 0000 0000 0000" maxLength="16" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E5B869] outline-none" />
                                                </div>
                                            </div>
                                            <div className="pt-4 flex justify-end">
                                                <button type="submit" className="px-6 py-2 bg-[#2A3F45] text-white rounded-lg hover:bg-[#1f2e33] font-medium shadow-sm">Guardar Cambios</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Telefono de contacto</h3>
                                                    <p className="text-gray-800 font-medium">{profileData.phone || 'No registrado'}</p>
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-medium text-gray-500 mb-1">Metodo de Pago Predeterminado</h3>
                                                    <p className="text-gray-800 font-medium">{profileData.savedCard ? `Terminada en ${profileData.savedCard.slice(-4)}` : 'Ninguna tarjeta registrada'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-10 flex flex-col md:flex-row gap-4 justify-end border-t pt-6">
                                                {/*  DESACTIVAR (Lo que te permite recuperarla luego en Prisma Studio) */}
                                                <button
                                                    onClick={handleDeactivate}
                                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    Desactivar mi cuenta temporalmente
                                                </button>

                                                {/* ELIMINAR (Borrado físico de la DB) */}
                                                <button
                                                    onClick={handleDelete}
                                                    className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                                                >
                                                    Eliminar cuenta permanentemente
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showReservationForm && selectedFlight && (
                <ReservationForm
                    flight={selectedFlight}
                    onCancel={() => { setShowReservationForm(false); setSelectedFlight(null); }}
                    onSuccess={(flight, passengers) => {
                        setShowReservationForm(false);
                        setCurrentReservationData({ flight, passengers });
                        setShowPaymentModal(true);
                    }}
                />
            )}

            {showPaymentModal && currentReservationData && (
                <PaymentSimulation
                    totalAmount={currentReservationData.flight.price * currentReservationData.passengers.length}
                    savedCard={profileData.savedCard}
                    onCancel={() => { setShowPaymentModal(false); setSelectedFlight(null); }}
                    onSuccess={() => { setShowPaymentModal(false); setShowSuccessModal(true); }}
                />
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-[#2A3F45] mb-2">Reserva Exitosa</h2>
                        <p className="text-gray-600 mb-8 text-sm leading-relaxed">
                            Tus tiquetes electronicos y el comprobante de pago han sido generados y enviados a tu correo registrado.
                        </p>
                        <button onClick={() => { setShowSuccessModal(false); setCurrentView('tickets'); }} className="w-full py-3.5 bg-[#2A3F45] text-white rounded-xl font-bold hover:bg-[#1f2e33] transition-colors shadow-md active:scale-95">
                            Ver Mis Billetes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;