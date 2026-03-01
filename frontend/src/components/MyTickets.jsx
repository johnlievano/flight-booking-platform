import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}/api`;

const MyTickets = () => {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/reservations`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setReservations(response.data);
            } catch (err) {
                console.error("Error cargando billetes:", err);
                setError('No se pudieron cargar tus billetes. Por favor, intenta más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    // Funcion auxiliar para determinar el color y texto del estado del vuelo
    const getFlightStatusConfig = (status) => {
        switch (status) {
            case 'DELAYED':
                return { text: 'RETRASADO', classes: 'bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse' };
            case 'CANCELLED':
                return { text: 'CANCELADO', classes: 'bg-red-100 text-red-800 border-red-300' };
            case 'SCHEDULED':
            default:
                return { text: 'A TIEMPO', classes: 'bg-green-100 text-green-800 border-green-300' };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <svg className="w-10 h-10 animate-spin mb-4 text-[#E5B869]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p>Generando tus pases de abordar...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-sm">
                <p className="font-medium">{error}</p>
            </div>
        );
    }

    if (!reservations || reservations.length === 0) {
        return (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes viajes programados</h3>
                <p className="text-gray-500">Tus reservas y pases de abordar aparecerán aquí.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {reservations.map((reservation) => (
                <div key={reservation.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Cabecera de la Reserva */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Reserva Confirmada</p>
                            <p className="text-sm font-bold text-[#2A3F45]">Ref: RES-{reservation.id.toString().padStart(6, '0')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500">Fecha de compra</p>
                            <p className="text-sm font-medium">{new Date(reservation.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Lista de Tickets dentro de la reserva */}
                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {reservation.tickets && reservation.tickets.map((ticket) => {
                            const flightData = reservation.flights?.find(rf => rf.flightId === ticket.flightId)?.flight;
                            const passengerData = reservation.passengers?.find(p => p.id === ticket.passengerId);

                            if (!flightData || !passengerData) return null;

                            const seatMatch = ticket.ticketNumber?.match(/TKT-([0-9A-Z]+)-/);
                            const seatNumber = seatMatch ? seatMatch[1] : 'S/A';
                            
                            // Obtenemos la configuracion visual del estado del vuelo
                            const statusConfig = getFlightStatusConfig(flightData.status);

                            return (
                                <div key={ticket.id} className={`flex flex-col relative border-2 rounded-xl overflow-hidden transition-colors ${flightData.status === 'CANCELLED' ? 'border-red-200 opacity-80 bg-red-50/30' : 'border-gray-100 hover:border-[#E5B869]'}`}>
                                    <div className={`absolute top-0 left-0 bottom-0 w-4 border-r-2 border-dashed border-white/50 flex flex-col justify-center gap-2 py-4 ${flightData.status === 'CANCELLED' ? 'bg-red-400' : 'bg-[#2A3F45]'}`}>
                                        <div className="w-2 h-4 bg-white rounded-r-full absolute top-1/4 -left-1"></div>
                                        <div className="w-2 h-4 bg-white rounded-r-full absolute bottom-1/4 -left-1"></div>
                                    </div>

                                    <div className="pl-8 pr-6 py-5">
                                        <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-3">
                                            <div>
                                                <p className="text-xs text-gray-400">Operado por</p>
                                                <p className="font-bold text-[#2A3F45]">{flightData.airline?.name || 'N/A'}</p>
                                            </div>
                                            
                                            <div className="flex items-center gap-3">
                                                {/* BADGE DINAMICO DE ESTADO DEL VUELO */}
                                                <div className={`px-2 py-1 rounded text-[10px] font-black border tracking-wider ${statusConfig.classes}`}>
                                                    {statusConfig.text}
                                                </div>

                                                <div className={`text-right px-3 py-1 rounded-lg border ${flightData.status === 'CANCELLED' ? 'bg-red-50 border-red-100' : 'bg-yellow-50 border-yellow-100'}`}>
                                                    <p className="text-xs text-gray-500">Asiento</p>
                                                    <p className={`font-black text-lg ${flightData.status === 'CANCELLED' ? 'text-red-400 line-through' : 'text-[#E5B869]'}`}>{seatNumber}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-xs text-gray-400">Pasajero</p>
                                            <p className="font-bold text-gray-800 uppercase">{passengerData.fullName}</p>
                                            <p className="text-xs text-gray-500">Doc: {passengerData.document}</p>
                                        </div>

                                        <div className={`flex items-center justify-between mt-4 ${flightData.status === 'CANCELLED' ? 'opacity-60' : ''}`}>
                                            <div className="w-1/3">
                                                <p className="text-2xl font-black text-[#2A3F45]">{flightData.origin?.code || '---'}</p>
                                                <p className="text-xs text-gray-500">{flightData.departureTime ? new Date(flightData.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                            </div>

                                            <div className="w-1/3 flex flex-col items-center">
                                                <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                                <p className="text-[10px] text-gray-400 mt-1 text-center truncate w-full">{flightData.departureTime ? new Date(flightData.departureTime).toLocaleDateString() : '---'}</p>
                                            </div>

                                            <div className="w-1/3 text-right">
                                                <p className="text-2xl font-black text-[#2A3F45]">{flightData.destination?.code || '---'}</p>
                                                <p className="text-xs text-gray-500">{flightData.arrivalTime ? new Date(flightData.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center pl-8">
                                        <div className="font-mono text-xs text-gray-400 tracking-widest truncate">
                                            ||| | || |||| | | |||
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400">TKT #{ticket.id}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MyTickets;