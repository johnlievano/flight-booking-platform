import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ totalFlights: 0, totalUsers: 0, totalBookings: 0 });
  const [flights, setFlights] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [formData, setFormData] = useState({
    airlineId: '',
    originAirportId: '',
    destinationAirportId: '',
    departureTime: '',
    arrivalTime: '',
    price: '',
    totalSeats: 150
  });

  const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
  setLoading(true);
  setError(null);
  try {
    const [flightsRes, usersRes, bookingsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/admin/flights`, axiosConfig),
      axios.get(`${API_BASE_URL}/admin/users`, axiosConfig),
      axios.get(`${API_BASE_URL}/admin/bookings`, axiosConfig)
    ]);

    setFlights(flightsRes.data.flights);  // <-- cambio aquí
    setUsers(usersRes.data);
    setBookings(bookingsRes.data);
    setStats({
      totalFlights: flightsRes.data.total,  // <-- cambio aquí
      totalUsers: usersRes.data.length,
      totalBookings: bookingsRes.data.length
    });
  } catch (err) {
    console.error('Error fetching data:', err);
    setError('Error al cargar datos');
  } finally {
    setLoading(false);
  }
};

  const updateFlightStatus = async (flightId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/flights/${flightId}/status`,
        { status: newStatus },
        axiosConfig
      );
      setFlights(flights.map(f => f.id === flightId ? { ...f, status: newStatus } : f));
    } catch (err) {
      console.error('Error updating flight status:', err);
      setError('Error al actualizar estado del vuelo');
    }
  };

  const createFlight = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/flights`,
        {
          ...formData,
          airlineId: parseInt(formData.airlineId),
          originAirportId: parseInt(formData.originAirportId),
          destinationAirportId: parseInt(formData.destinationAirportId),
          price: parseFloat(formData.price),
          totalSeats: parseInt(formData.totalSeats)
        },
        axiosConfig
      );
      setFlights([...flights, response.data.flight]);
      setShowAddFlightModal(false);
      setFormData({
        airlineId: '',
        originAirportId: '',
        destinationAirportId: '',
        departureTime: '',
        arrivalTime: '',
        price: '',
        totalSeats: 150
      });
    } catch (err) {
      console.error('Error creating flight:', err);
      setError('Error al crear vuelo');
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/status`,
        { isActive },
        axiosConfig
      );
      await fetchAllData();
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Error al actualizar el estado del usuario');
    }
  };

  const deleteUser = async (userId) => {
    const confirmed = window.confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, axiosConfig);
      await fetchAllData();
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Error al eliminar el usuario');
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/bookings/${bookingId}/status`,
        { status: newStatus },
        axiosConfig
      );
      await fetchAllData();
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Error al actualizar el estado de la reserva');
    }
  };

  // Overview Section
  const OverviewSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg">
        <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider mb-2">Total de Vuelos</h3>
        <p className="text-4xl font-bold text-[#E5B869]">{stats.totalFlights}</p>
      </div>
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg">
        <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider mb-2">Total de Usuarios</h3>
        <p className="text-4xl font-bold text-[#E5B869]">{stats.totalUsers}</p>
      </div>
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg">
        <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider mb-2">Total de Reservas</h3>
        <p className="text-4xl font-bold text-[#E5B869]">{stats.totalBookings}</p>
      </div>
    </div>
  );

  // Flights Section
  const FlightsSection = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Gestión de Vuelos</h2>
        <button
          onClick={() => setShowAddFlightModal(true)}
          className="px-4 py-2 bg-[#E5B869] text-[#2A3F45] font-semibold rounded-lg hover:bg-[#d4a556] transition-colors"
        >
          + Agregar Vuelo
        </button>
      </div>
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/10">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Aerolínea</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Ruta</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Salida</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Asientos</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Precio</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-200">Estado</th>
            </tr>
          </thead>
          <tbody>
            {flights.map(flight => (
              <tr key={flight.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-300">{flight.airline?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {flight.origin?.code} → {flight.destination?.code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {new Date(flight.departureTime).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {flight.availableSeats}/{flight.totalSeats}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">${flight.price}</td>
                <td className="px-6 py-4">
                  <select
                    value={flight.status}
                    onChange={(e) => updateFlightStatus(flight.id, e.target.value)}
                    className="px-3 py-1 rounded text-sm bg-[#2A3F45] text-white border border-white/20 focus:outline-none"
                  >
                    <option value="ON_TIME">A Tiempo</option>
                    <option value="DELAYED">Retrasado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Users Section
  const UsersSection = () => (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gestión de Usuarios</h2>
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/10">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Teléfono</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Rol</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-200">Reservas</th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-200">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-300">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{user.email}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{user.phone || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${
                    user.role === 'ADMIN' 
                      ? 'bg-red-500/30 text-red-200' 
                      : 'bg-blue-500/30 text-blue-200'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-300 font-semibold">{user.bookingCount}</td>
                <td className="px-6 py-4 text-sm text-center space-x-2">
                  <button
                    onClick={() => updateUserStatus(user.id, !user.isActive)}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${user.isActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                  >
                    {user.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-1 rounded text-xs font-semibold bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Bookings Section
  const BookingsSection = () => (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Todas las Reservas</h2>
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/10">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Pasajero</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Vuelos</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">Estado</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-200">Total</th>
             </tr>
          </thead>
          <tbody>
            {bookings.map(booking => (
              <tr key={booking.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-300">{booking.user?.name}</td>
                <td className="px-6 py-4 text-sm text-gray-300">{booking.user?.email}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {booking.flights.map(rf => `${rf.flight?.origin?.code}-${rf.flight?.destination?.code}`).join(', ')}
                </td>
                <td className="px-6 py-4 text-sm">
                  <select
                    value={booking.status}
                    onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                    className="w-full bg-[#2A3F45] text-white rounded-lg px-3 py-2 border border-white/20 focus:outline-none"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-right text-gray-300 font-semibold">${booking.totalPrice}</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#2A3F45] overflow-hidden font-sans">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1a2a2f] text-white flex flex-col shadow-2xl z-50 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:relative md:translate-x-0 transition-transform duration-300`}>
        <div className="p-6 text-center border-b border-white/10">
          <h1 className="text-2xl font-bold text-[#E5B869]">AereoManage</h1>
          <p className="text-xs text-gray-400 mt-1">Panel Administrativo</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {['overview', 'flights', 'users', 'bookings'].map(section => (
            <button
              key={section}
              onClick={() => {
                setCurrentView(section);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                currentView === section
                  ? 'bg-[#E5B869] text-[#2A3F45] font-bold'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              {section === 'overview' && 'Resumen'}
              {section === 'flights' && 'Vuelos'}
              {section === 'users' && 'Usuarios'}
              {section === 'bookings' && 'Reservas'}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              onLogout();
            }}
            className="w-full py-3 text-sm bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="md:hidden bg-[#2A3F45] shadow-md px-4 py-3 flex justify-between items-center border-b border-white/10">
          <h1 className="text-lg font-bold text-white">AereoManage</h1>
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-linear-to-br from-[#2A3F45] to-[#1a2a2f]">
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center text-gray-300">Cargando...</div>
          )}

          {!loading && (
            <>
              {currentView === 'overview' && <OverviewSection />}
              {currentView === 'flights' && <FlightsSection />}
              {currentView === 'users' && <UsersSection />}
              {currentView === 'bookings' && <BookingsSection />}
            </>
          )}
        </main>
      </div>

      {/* Add Flight Modal */}
      {showAddFlightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A3F45] rounded-lg p-6 max-w-md w-full border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Agregar Nuevo Vuelo</h2>
            <form onSubmit={createFlight} className="space-y-3">
              <input
                type="number"
                placeholder="Airline ID"
                value={formData.airlineId}
                onChange={(e) => setFormData({...formData, airlineId: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Origin Airport ID"
                value={formData.originAirportId}
                onChange={(e) => setFormData({...formData, originAirportId: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Destination Airport ID"
                value={formData.destinationAirportId}
                onChange={(e) => setFormData({...formData, destinationAirportId: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="datetime-local"
                value={formData.departureTime}
                onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                required
              />
              <input
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={(e) => setFormData({...formData, arrivalTime: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Precio"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#E5B869] text-[#2A3F45] font-semibold rounded hover:bg-[#d4a556] transition-colors"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFlightModal(false)}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;