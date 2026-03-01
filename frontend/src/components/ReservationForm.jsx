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
    const [activePassengerIndex, setActivePassengerIndex] = useState(0); 

    // 1. Cargar el mapa de asientos del vuelo
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
        if (passengers.length < flight.totalSeats) {
            setPassengers([...passengers, { fullName: '', document: '', seatId: null, seatNumber: '' }]);
        } else {
            setError(`Capacidad maxima alcanzada.`);
        }
    };

    const removePassenger = (index) => {
        if (passengers.length > 1) {
            const newPassengers = passengers.filter((_, i) => i !== index);
            setPassengers(newPassengers);
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
        if (seat.isOccupied) return;

        const isAlreadySelectedByMe = passengers.some(p => p.seatId === seat.id);
        
        if (isAlreadySelectedByMe) {
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

        const updated = [...passengers];
        updated[activePassengerIndex].seatId = seat.id;
        updated[activePassengerIndex].seatNumber = seat.number;
        setPassengers(updated);

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

            const payload = {
                flightIds: [flight.id],
                passengers: passengers.map(p => ({
                    fullName: p.fullName,
                    document: p.document,
                    seatId: p.seatId
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
    // Renderizado UI (Actualizado para Móviles)
    // ------------------------------------------------
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-0 md:p-4 z-50">
            <div className="bg-white md:rounded-2xl shadow-2xl max-w-5xl w-full h-full md:h-auto md:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                
                {/* Cabecera */}
                <div className="bg-[#2A3F45] text-white px-4 py-4 md:px-8 md:py-5 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-[#E5B869]">Configurar Reserva</h2>
                        <p className="text-xs md:text-sm opacity-90 mt-1 flex items-center gap-2">
                            <span>{flight.origin?.city}</span>
                            <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            <span>{flight.destination?.city}</span>
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] md:text-xs text-gray-400">Vuelo</p>
                        <p className="font-mono font-bold text-sm md:text-base">{flight.airline?.code}-{flight.id}</p>
                    </div>
                </div>

                {/* Contenedor Principal (Una sola columna scrollable en móvil) */}
                <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
                    
                    {/* COLUMNA IZQUIERDA: Formulario de Pasajeros */}
                    <div className="w-full md:flex-1 md:overflow-y-auto p-4 md:p-8 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 shrink-0">
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 shadow-sm animate-in slide-in-from-top-2">
                                <p className="font-medium text-sm">{error}</p>
                            </div>
                        )}

                        <form id="reservationForm" onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex justify-between items-center mb-6 border-b pb-4">
                                <div>
                                    <h3 className="text-base md:text-lg font-bold text-gray-800">Pasajeros</h3>
                                    <p className="text-xs md:text-sm text-gray-500">Datos del documento</p>
                                </div>
                                <button type="button" onClick={addPassenger} className="px-3 py-1.5 md:px-4 md:py-2 bg-white border border-[#2A3F45] text-[#2A3F45] rounded-lg hover:bg-gray-50 text-xs md:text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Añadir
                                </button>
                            </div>

                            <div className="space-y-4">
                                {passengers.map((passenger, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-4 md:p-5 rounded-xl border transition-all ${activePassengerIndex === index ? 'border-[#E5B869] bg-yellow-50/30 shadow-md ring-1 ring-[#E5B869]/50' : 'border-gray-200 bg-white shadow-sm'}`}
                                        onClick={() => setActivePassengerIndex(index)}
                                    >
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm ${activePassengerIndex === index ? 'bg-[#E5B869] text-[#2A3F45]' : 'bg-gray-200 text-gray-600'}`}>
                                                    {index + 1}
                                                </div>
                                                <span className="font-bold text-gray-700 text-sm md:text-base">Pasajero {index + 1}</span>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 md:gap-4">
                                                {passenger.seatNumber ? (
                                                    <span className="px-2 py-1 md:px-3 md:py-1 bg-green-100 text-green-800 text-[10px] md:text-xs font-bold rounded-full border border-green-200">
                                                        Asiento: {passenger.seatNumber}
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-1 md:px-3 md:py-1 bg-red-100 text-red-800 text-[10px] md:text-xs font-bold rounded-full border border-red-200 animate-pulse">
                                                        Sin asiento
                                                    </span>
                                                )}

                                                {passengers.length > 1 && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); removePassenger(index); }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                            <div>
                                                <label className="block text-[10px] md:text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Nombre Completo</label>
                                                <input type="text" value={passenger.fullName} onChange={(e) => updatePassenger(index, 'fullName', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 md:p-2.5 focus:ring-2 focus:ring-[#E5B869] outline-none text-sm" required />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] md:text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Documento</label>
                                                <input type="text" value={passenger.document} onChange={(e) => updatePassenger(index, 'document', e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 md:p-2.5 focus:ring-2 focus:ring-[#E5B869] outline-none text-sm" required />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </form>
                    </div>

                    {/* COLUMNA DERECHA: Mapa de Asientos Visual */}
                    <div className="w-full md:w-[400px] bg-white flex flex-col shrink-0 md:overflow-y-auto">
                        <div className="p-4 md:p-6 border-b border-gray-100">
                            <h3 className="text-base md:text-lg font-bold text-[#2A3F45] flex items-center gap-2">
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#E5B869]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                Mapa de Asientos
                            </h3>
                            <p className="text-[10px] md:text-xs text-gray-500 mt-1">Seleccionando para: <strong className="text-[#2A3F45]">Pasajero {activePassengerIndex + 1}</strong></p>
                            
                            <div className="flex gap-2 md:gap-4 mt-4 text-[10px] md:text-xs font-medium bg-gray-50 p-2 rounded-lg justify-center">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white border border-gray-300"></div>Libre</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>Ocupado</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#E5B869] border border-[#d4a556]"></div>Seleccion</div>
                            </div>
                        </div>

                        <div className="flex-1 md:overflow-y-auto p-4 md:p-8 bg-gray-100/50 relative">
                            {loadingSeats ? (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <svg className="w-8 h-8 animate-spin mb-2 text-[#E5B869]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Cargando cabina...
                                </div>
                            ) : (
                                <div className="max-w-[240px] md:max-w-[260px] mx-auto bg-white p-4 rounded-[40px] shadow-inner border-[8px] border-gray-200 relative pb-12 pt-8 mb-6 md:mb-0">
                                    <div className="absolute top-0 inset-x-0 h-16 bg-gray-200 rounded-t-[32px] flex items-end justify-center pb-2 opacity-50">
                                        <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
                                    </div>

                                    <div className="grid grid-cols-5 gap-y-3 mt-8">
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">A</div>
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">B</div>
                                        <div className="text-center text-[10px] font-bold text-gray-300 mb-2">Pasillo</div>
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">C</div>
                                        <div className="text-center text-[10px] font-bold text-gray-400 mb-2">D</div>

                                        {Array.from({ length: 10 }).map((_, rowIndex) => {
                                            const rowNumber = rowIndex + 1;
                                            const rowSeats = seats.filter(s => s.number.startsWith(rowNumber.toString()) && s.number.length === (rowNumber < 10 ? 2 : 3));
                                            
                                            const seatA = rowSeats.find(s => s.number.endsWith('A'));
                                            const seatB = rowSeats.find(s => s.number.endsWith('B'));
                                            const seatC = rowSeats.find(s => s.number.endsWith('C'));
                                            const seatD = rowSeats.find(s => s.number.endsWith('D'));

                                            const renderSeatBtn = (seat) => {
                                                if (!seat) return <div className="w-8 h-8 md:w-10 md:h-10"></div>; 
                                                
                                                const isSelectedByMe = passengers.some(p => p.seatId === seat.id);
                                                let stateClass = "bg-white border-gray-300 text-gray-500 hover:border-[#E5B869] hover:bg-yellow-50"; 
                                                
                                                if (seat.isOccupied) {
                                                    stateClass = "bg-red-50 border-red-200 text-red-300 cursor-not-allowed line-through"; 
                                                } else if (isSelectedByMe) {
                                                    stateClass = "bg-[#E5B869] border-[#d4a556] text-[#2A3F45] font-bold shadow-md transform scale-110 ring-2 ring-[#E5B869]/30"; 
                                                }

                                                return (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSeatSelect(seat)}
                                                        disabled={seat.isOccupied}
                                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-t-xl rounded-b flex items-center justify-center text-[10px] md:text-xs border-2 transition-all duration-200 ${stateClass}`}
                                                        title={`Asiento ${seat.number}`}
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
                <div className="bg-white border-t border-gray-200 px-4 py-4 md:px-8 flex flex-col md:flex-row justify-between md:items-center shrink-0 gap-4 md:gap-0">
                    <div className="flex justify-between items-center md:block">
                        <p className="text-xs md:text-sm text-gray-500 font-medium">Total a pagar</p>
                        <p className="text-xl md:text-2xl font-bold text-green-600">${(flight.price * passengers.length).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                        <button type="button" onClick={onCancel} className="flex-1 md:flex-none px-4 py-3 md:px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                            Cancelar
                        </button>
                        <button type="submit" form="reservationForm" disabled={loading || passengers.some(p => p.seatId === null)} className="flex-[2] md:flex-none px-4 py-3 md:px-8 bg-[#E5B869] text-[#2A3F45] rounded-lg hover:bg-[#d4a556] text-sm font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {loading ? 'Procesando...' : 'Ir al Pago'}
                            {!loading && <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ReservationForm;