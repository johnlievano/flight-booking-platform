import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const ReservationForm = ({ flight, onCancel, onSuccess }) => {
    // ------------------------------------------------
    // Estados Base
    // ------------------------------------------------
    const [passengers, setPassengers] = useState([{ fullName: '', document: '', seatId: null, seatNumber: '' }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // ------------------------------------------------
    // Estados del Mapa de Asientos
    // ------------------------------------------------
    const [seats, setSeats] = useState([]);
    const [loadingSeats, setLoadingSeats] = useState(true);
    // Controla a qué pasajero le estamos asignando el asiento actualmente
    const [activePassengerIndex, setActivePassengerIndex] = useState(0); 

    // 1. Cargar el mapa de asientos del vuelo al abrir el modal
    useEffect(() => {
        const fetchSeats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/flights/${flight.id}/seats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSeats(response.data);
            } catch (err) {
                console.error('Error al cargar la cabina:', err);
                setError('No se pudo cargar el mapa de asientos. Por favor intente de nuevo.');
            } finally {
                setLoadingSeats(false);
            }
        };
        fetchSeats();
    }, [flight.id]);

    // ------------------------------------------------
    // Logica de Pasajeros
    // ------------------------------------------------
    const addPassenger = () => {
        if (passengers.length < flight.availableSeats) {
            setPassengers([...passengers, { fullName: '', document: '', seatId: null, seatNumber: '' }]);
        } else {
            setError(`Solo quedan ${flight.availableSeats} asientos disponibles en este vuelo.`);
        }
    };

    const removePassenger = (index) => {
        if (passengers.length > 1) {
            const newPassengers = passengers.filter((_, i) => i !== index);
            setPassengers(newPassengers);
            // Si borramos al pasajero que estaba activo, reseteamos el indice
            if (activePassengerIndex >= newPassengers.length) {
                setActivePassengerIndex(newPassengers.length - 1);
            }
        }
    };

    const updatePassenger = (index, field, value) => {
        const updated = [...passengers];
        updated[index][field] = value;
        setPassengers(updated);
    };

    // ------------------------------------------------
    // Lógica de Selección de Asientos
    // ------------------------------------------------
    const handleSeatSelect = (seat) => {
        if (seat.isOccupied) return; // No se puede seleccionar ocupados

        // Verificar si el asiento ya fue seleccionado por otro pasajero en este mismo formulario
        const isAlreadySelectedByMe = passengers.some(p => p.seatId === seat.id);
        
        if (isAlreadySelectedByMe) {
            // Si hago clic en mi propio asiento, lo deselecciono
            if (passengers[activePassengerIndex].seatId === seat.id) {
                const updated = [...passengers];
                updated[activePassengerIndex].seatId = null;
                updated[activePassengerIndex].seatNumber = '';
                setPassengers(updated);
            } else {
                setError(`El asiento ${seat.number} ya esta asignado a otro pasajero de tu grupo.`);
                setTimeout(() => setError(''), 3000);
            }
            return;
        }

        // Asignar el asiento al pasajero activo
        const updated = [...passengers];
        updated[activePassengerIndex].seatId = seat.id;
        updated[activePassengerIndex].seatNumber = seat.number;
        setPassengers(updated);

        // Auto-avanzar al siguiente pasajero si hay uno sin asiento
        const nextUnassignedIndex = updated.findIndex(p => p.seatId === null);
        if (nextUnassignedIndex !== -1) {
            setActivePassengerIndex(nextUnassignedIndex);
        }
    };

    // ------------------------------------------------
    // Envio al Backend
    // ------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validacion crucial: Todos deben tener asiento
        const unassigned = passengers.some(p => p.seatId === null);
        if (unassigned) {
            setError('Debes seleccionar un asiento para cada pasajero antes de continuar.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No hay sesion activa');

            // El backend ahora espera los datos con el seatId para bloquearlos en la BD
            const payload = {
                flightIds: [flight.id],
                passengers: passengers.map(p => ({
                    fullName: p.fullName,
                    document: p.document,
                    seatId: p.seatId // Nuevo dato
                }))
            };

            const response = await axios.post(`${API_URL}/reservations`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            onSuccess(flight, passengers);
        } catch (err) {
            console.error('Error creando reserva:', err);
            setError(err.response?.data?.error || 'Error al crear la reserva');
        } finally {
            setLoading(false);
        }
    };

    // ------------------------------------------------
    // Renderizado UI
    // ------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                
                {/* Cabecera */}
                <div className="bg-[#2A3F45] text-white px-8 py-5 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold text-[#E5B869]">Configurar Reserva</h2>
                        <p className="text-sm opacity-90 mt-1 flex items-center gap-2">
                            <span>{flight.origin?.city}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            <span>{flight.destination?.city}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-400">Vuelo</p>
                        <p className="font-mono font-bold">{flight.airline?.code}-{flight.id}</p>
                    </div>
                </div>

                {/* Contenedor Principal (2 Columnas en Desktop) */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* COLUMNA IZQUIERDA: Formulario de Pasajeros */}
                    <div className="flex-1 overflow-y-auto p-8 border-r border-gray-100 bg-gray-50">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm animate-in slide-in-from-top-2">
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        <form id="reservationForm" onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Informacion de Pasajeros</h3>
                                    <p className="text-sm text-gray-500">Ingresa los datos exactos del documento</p>
                                </div>
                                <button type="button" onClick={addPassenger} className="px-4 py-2 bg-white border border-[#2A3F45] text-[#2A3F45] rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Añadir
                                </button>
                            </div>

                            <div className="space-y-4">
                                {passengers.map((passenger, index) => (
                                    <div 
                                        key={index} 
                                        // Efecto visual: Resalta al pasajero que esta seleccionando asiento actualmente
                                        className={`p-5 rounded-xl border transition-all ${activePassengerIndex === index ? 'border-[#E5B869] bg-yellow-50/30 shadow-md ring-1 ring-[#E5B869]/50' : 'border-gray-200 bg-white shadow-sm'}`}
                                        onClick={() => setActivePassengerIndex(index)}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${activePassengerIndex === index ? 'bg-[#E5B869] text-[#2A3F45]' : 'bg-gray-200 text-gray-600'}`}>
                                                    {index + 1}
                                                </div>
                                                <span className="font-bold text-gray-700">Pasajero {index + 1}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                {passenger.seatNumber ? (
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">
                                                        Asiento: {passenger.seatNumber}
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full border border-red-200 animate-pulse">
                                                        Sin asiento
                                                    </span>
                                                )}

                                                {passengers.length > 1 && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); removePassenger(index); }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Nombre Completo</label>
                                                <input type="text" value={passenger.fullName} onChange={(e) => updatePassenger(index, 'fullName', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#E5B869] outline-none text-sm" required />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Documento / Pasaporte</label>
                                                <input type="text" value={passenger.document} onChange={(e) => updatePassenger(index, 'document', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#E5B869] outline-none text-sm" required />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </form>
                    </div>

                    {/* COLUMNA DERECHA: Mapa de Asientos Visual */}
                    <div className="w-full md:w-[400px] bg-white flex flex-col shrink-0">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-[#2A3F45] flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#E5B869]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                Selección de Asientos
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Seleccionando para: <strong className="text-[#2A3F45]">Pasajero {activePassengerIndex + 1}</strong></p>
                            
                            <div className="flex gap-4 mt-4 text-xs font-medium bg-gray-50 p-2 rounded-lg justify-center">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-white border border-gray-300"></div>Libre</div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>Ocupado</div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#E5B869] border border-[#d4a556]"></div>Tu Seleccion</div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-gray-100/50 relative">
                            {loadingSeats ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <svg className="w-8 h-8 animate-spin mb-2 text-[#E5B869]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Cargando cabina...
                                </div>
                            ) : (
                                <div className="max-w-[260px] mx-auto bg-white p-4 rounded-[40px] shadow-inner border-[8px] border-gray-200 relative pb-12 pt-8">
                                    {/* Cabina del piloto (Visual) */}
                                    <div className="absolute top-0 inset-x-0 h-16 bg-gray-200 rounded-t-[32px] flex items-end justify-center pb-2 opacity-50">
                                        <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
                                    </div>

                                    {/* Renderizado matricial de asientos (Asumiendo 4 columnas A,B y C,D) */}
                                    <div className="grid grid-cols-5 gap-y-3 mt-8">
                                        {/* Cabeceras de columnas */}
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">A</div>
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">B</div>
                                        <div className="text-center text-[10px] font-bold text-gray-300 mb-2">Pasillo</div>
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">C</div>
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">D</div>

                                        {/* Logica para agrupar asientos por fila */}
                                        {Array.from({ length: 10 }).map((_, rowIndex) => {
                                            const rowNumber = rowIndex + 1;
                                            const rowSeats = seats.filter(s => s.number.startsWith(rowNumber.toString()) && s.number.length === (rowNumber < 10 ? 2 : 3));
                                            
                                            // Extraemos los asientos especificos
                                            const seatA = rowSeats.find(s => s.number.endsWith('A'));
                                            const seatB = rowSeats.find(s => s.number.endsWith('B'));
                                            const seatC = rowSeats.find(s => s.number.endsWith('C'));
                                            const seatD = rowSeats.find(s => s.number.endsWith('D'));

                                            // Funcion auxiliar para renderizar un boton de asiento
                                            const renderSeatBtn = (seat) => {
                                                if (!seat) return <div className="w-10 h-10"></div>; // Espacio vacio si no existe
                                                
                                                const isSelectedByMe = passengers.some(p => p.seatId === seat.id);
                                                let stateClass = "bg-white border-gray-300 text-gray-500 hover:border-[#E5B869] hover:bg-yellow-50"; // Libre
                                                
                                                if (seat.isOccupied) {
                                                    stateClass = "bg-red-50 border-red-200 text-red-300 cursor-not-allowed line-through"; // Ocupado
                                                } else if (isSelectedByMe) {
                                                    stateClass = "bg-[#E5B869] border-[#d4a556] text-[#2A3F45] font-bold shadow-md transform scale-110 ring-2 ring-[#E5B869]/30"; // Seleccionado
                                                }

                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSeatSelect(seat)}
                                                        disabled={seat.isOccupied}
                                                        className={`w-10 h-10 rounded-t-xl rounded-b flex items-center justify-center text-xs border-2 transition-all duration-200 ${stateClass}`}
                                                        title={`Asiento ${seat.number} ${seat.isOccupied ? '(Ocupado)' : '(Libre)'}`}
                                                    >
                                                        {seat.number}
                                                    </button>
                                                );
                                            };

                                            return (
                                                <div key={`row-${rowNumber}`} className="contents">
                                                    {renderSeatBtn(seatA)}
                                                    {renderSeatBtn(seatB)}
                                                    <div className="flex items-center justify-center text-[10px] font-medium text-gray-300">{rowNumber}</div>
                                                    {renderSeatBtn(seatC)}
                                                    {renderSeatBtn(seatD)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pie del Modal (Totales y Botones) */}
                <div className="bg-white border-t border-gray-200 px-8 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Total a pagar</p>
                        <p className="text-2xl font-bold text-green-600">${(flight.price * passengers.length).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onCancel} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" form="reservationForm" disabled={loading || passengers.some(p => p.seatId === null)} className="px-8 py-3 bg-[#E5B869] text-[#2A3F45] rounded-lg hover:bg-[#d4a556] font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                            {loading ? 'Procesando...' : 'Ir al Pago'}
                            {!loading && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReservationForm;