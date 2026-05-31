import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

const AdminDashboard = ({ onLogout }) => {
  const [currentView, setCurrentView] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalUsers: 0,
    totalBookings: 0,
  });
  const [flights, setFlights] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddFlightModal, setShowAddFlightModal] = useState(false);
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "PASSENGER",
  });
  const [formData, setFormData] = useState({
    airlineId: "",
    originAirportId: "",
    destinationAirportId: "",
    departureTime: "",
    arrivalTime: "",
    price: "",
    totalSeats: 150,
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:4000/api";
  const token = localStorage.getItem("token");

  const currentUserId = (() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.userId || null;
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  })();

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
        axios.get(`${API_BASE_URL}/admin/flights?all=true`, axiosConfig),
        axios.get(`${API_BASE_URL}/admin/users`, axiosConfig),
        axios.get(`${API_BASE_URL}/admin/bookings`, axiosConfig),
      ]);

      // Some backends may still return a paginated subset even when asking for all;
      // if the returned flights length is less than total, fetch remaining pages.
      const initialFlights = flightsRes.data.flights || [];
      const total = flightsRes.data.total || initialFlights.length;
      let allFlights = initialFlights;
      const returnedPages = flightsRes.data.totalPages || Math.ceil(total / 50);
      if (initialFlights.length < total) {
        const perPage = 50;
        const pagesToFetch = Math.max(returnedPages, Math.ceil(total / perPage));
        const pageFetches = [];
        for (let p = 1; p <= pagesToFetch; p++) {
          pageFetches.push(
            axios.get(`${API_BASE_URL}/admin/flights?page=${p}&limit=${perPage}`, axiosConfig),
          );
        }
        const pagesRes = await Promise.all(pageFetches);
        allFlights = pagesRes.reduce((acc, r) => acc.concat(r.data.flights || []), []);
      }

      setFlights(allFlights);
      setUsers(usersRes.data);
      setBookings(bookingsRes.data);
      setStats({
        totalFlights: flightsRes.data.total, // total number reported by backend
        totalUsers: usersRes.data.length,
        totalBookings: bookingsRes.data.length,
      });
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const updateFlightStatus = async (flightId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/flights/${flightId}/status`,
        { status: newStatus },
        axiosConfig,
      );
      setFlights(
        flights.map((f) =>
          f.id === flightId ? { ...f, status: newStatus } : f,
        ),
      );
    } catch (err) {
      console.error("Error updating flight status:", err);
      setError("Error al actualizar estado del vuelo");
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
          totalSeats: parseInt(formData.totalSeats),
        },
        axiosConfig,
      );
      // Refresh entire dataset so new flight appears and counts are consistent
      await fetchAllData();
      setShowAddFlightModal(false);
      setFormData({
        airlineId: "",
        originAirportId: "",
        destinationAirportId: "",
        departureTime: "",
        arrivalTime: "",
        price: "",
        totalSeats: 150,
      });
    } catch (err) {
      console.error("Error creating flight:", err);
      setError("Error al crear vuelo");
    }
  };

  // Fetch airlines and airports when opening the add flight modal
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [airRes, airportRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/airlines`, axiosConfig),
          axios.get(`${API_BASE_URL}/airports`, axiosConfig),
        ]);
        setAirlines(airRes.data);
        setAirports(airportRes.data);
      } catch (err) {
        console.error("Error loading airlines/airports:", err);
      }
    };

    if (showAddFlightModal) loadOptions();
  }, [showAddFlightModal]);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/admin/users`, newUserForm, axiosConfig);
      setShowCreateUserModal(false);
      setNewUserForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "PASSENGER",
      });
      await fetchAllData();
    } catch (err) {
      console.error("Error creating user:", err);
      setError("Error al crear usuario");
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    if (userId === currentUserId) {
      setError(
        "No puedes cambiar el estado de tu propia cuenta de administrador",
      );
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/admin/users/${userId}/status`,
        { isActive },
        axiosConfig,
      );
      await fetchAllData();
    } catch (err) {
      console.error("Error updating user status:", err);
      setError("Error al actualizar el estado del usuario");
    }
  };

  const deleteUser = async (userId) => {
    if (userId === currentUserId) {
      setError("No puedes eliminar tu propia cuenta de administrador");
      return;
    }

    const confirmed = window.confirm(
      "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    try {
      await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, axiosConfig);
      await fetchAllData();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Error al eliminar el usuario");
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    if (!bookingId) {
      setError("Reserva inválida");
      return;
    }

    const endpoint = `${API_BASE_URL}/admin/bookings/${bookingId}/status`;
    try {
      await axios.put(endpoint, { status: newStatus }, axiosConfig);
      await fetchAllData();
    } catch (err) {
      console.error("Error updating booking status:", err);
      setError("Error al actualizar el estado de la reserva");
    }
  };

  // Overview Section
  const OverviewSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg">
        <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider mb-2">
          Total de Vuelos
        </h3>
        <p className="text-4xl font-bold text-[#E5B869]">
          {stats.totalFlights}
        </p>
      </div>
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg">
        <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider mb-2">
          Total de Usuarios
        </h3>
        <p className="text-4xl font-bold text-[#E5B869]">{stats.totalUsers}</p>
      </div>
      <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg">
        <h3 className="text-gray-200 text-sm font-semibold uppercase tracking-wider mb-2">
          Total de Reservas
        </h3>
        <p className="text-4xl font-bold text-[#E5B869]">
          {stats.totalBookings}
        </p>
      </div>
    </div>
  );

  // Flights Section
  const FlightsSection = () => {
    const [search, setSearch] = useState("");
    const [searchType, setSearchType] = useState("all");
    const [page, setPage] = useState(1);
    const perPage = 10;

    useEffect(() => {
      setPage(1);
    }, [search, searchType]);

    const filteredFlights = useMemo(() => {
      const query = search.trim().toLowerCase();
      if (!query) return flights;

      return flights.filter((flight) => {
        const idMatch = flight.id?.toString().includes(query);
        const routeCode = `${flight.origin?.code || ""}-${flight.destination?.code || ""}`.toLowerCase();
        const airlineMatch = flight.airline?.name?.toLowerCase().includes(query);
        const originCode = flight.origin?.code?.toLowerCase() || "";
        const destinationCode = flight.destination?.code?.toLowerCase() || "";
        const originMatch = flight.origin?.name?.toLowerCase().includes(query);
        const destMatch = flight.destination?.name?.toLowerCase().includes(query);

        switch (searchType) {
          case "id":
            return idMatch;
          case "route":
            return routeCode.includes(query);
          case "airline":
            return airlineMatch;
          case "airport":
            return originCode.includes(query) || destinationCode.includes(query) || originMatch || destMatch;
          default:
            return (
              idMatch ||
              routeCode.includes(query) ||
              airlineMatch ||
              originCode.includes(query) ||
              destinationCode.includes(query) ||
              originMatch ||
              destMatch
            );
        }
      });
    }, [flights, search, searchType]);

    const totalPages = Math.max(1, Math.ceil(filteredFlights.length / perPage));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * perPage;
    const pageFlights = filteredFlights.slice(start, start + perPage);

    const getPlaceholder = () => {
      switch (searchType) {
        case "id":
          return "Buscar por ID de vuelo";
        case "route":
          return "Buscar por ruta (BOG-LIM)";
        case "airline":
          return "Buscar por aerolínea";
        case "airport":
          return "Buscar por aeropuerto";
        default:
          return "Buscar por ID, ruta, aerolínea o aeropuerto";
      }
    };

    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-white">Gestión de Vuelos</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-3 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:outline-none text-sm w-full sm:w-44"
            >
              <option value="all">Buscar en todo</option>
              <option value="id">ID de vuelo</option>
              <option value="route">Ruta</option>
              <option value="airline">Aerolínea</option>
              <option value="airport">Aeropuerto</option>
            </select>
            <input
              placeholder={getPlaceholder()}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:outline-none text-sm w-full sm:w-72"
            />
            <button
              onClick={() => setShowAddFlightModal(true)}
              className="px-4 py-2 bg-[#E5B869] text-[#2A3F45] font-semibold rounded-lg hover:bg-[#d4a556] transition-colors whitespace-nowrap"
            >
              + Agregar Vuelo
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-300 py-8">
            Cargando vuelos...
          </div>
        ) : (
          <>
            <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-x-auto">
              <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/10">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                    Aerolínea
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                    Ruta
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                    Salida
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                    Asientos
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-200">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageFlights.length > 0 ? (
                  pageFlights.map((flight) => (
                    <tr
                      key={flight.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                        #{flight.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {flight.airline?.name}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-white">
                        {flight.origin?.code} → {flight.destination?.code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {new Date(flight.departureTime).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        {flight.availableSeats}/{flight.totalSeats}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        ${flight.price?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={flight.status}
                          onChange={(e) => updateFlightStatus(flight.id, e.target.value)}
                          style={{ colorScheme: "dark" }}
                          className={`px-2 py-1 rounded text-xs font-semibold border focus:outline-none cursor-pointer ${
                            flight.status === "ON_TIME"
                              ? "bg-green-500/20 text-green-300 border-green-500/50"
                              : flight.status === "DELAYED"
                                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                                : "bg-red-500/20 text-red-300 border-red-500/50"
                          }`}
                        >
                          <option value="ON_TIME">A Tiempo</option>
                          <option value="DELAYED">Retrasado</option>
                          <option value="CANCELLED">Cancelado</option>
                        </select>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-400">
                      No se encontraron vuelos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
            <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-400">
              Página {currentPage} de {totalPages} · {filteredFlights.length} vuelos
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 disabled:opacity-40 transition-colors"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white text-sm rounded-lg border border-white/10 disabled:opacity-40 transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    );
  };

  // Users Section
  const UsersSection = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Gestión de Usuarios</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="px-3 py-1 bg-[#E5B869] text-[#2A3F45] rounded-md font-semibold"
          >
            + Crear Usuario
          </button>
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/10">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                Email
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                Rol
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-200">
                Reservas
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-200">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-6 py-4 text-sm text-gray-300">{user.name}</td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-sm text-gray-300">
                  {user.phone || "-"}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      user.role === "ADMIN"
                        ? "bg-red-500/30 text-red-200"
                        : "bg-blue-500/30 text-blue-200"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-300 font-semibold">
                  {user.bookingCount}
                </td>
                <td className="px-6 py-4 text-sm text-center space-x-2">
                  <button
                    onClick={() => updateUserStatus(user.id, !user.isActive)}
                    disabled={user.id === currentUserId}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      user.isActive
                        ? "bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20"
                        : "bg-white/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                    } ${user.id === currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {user.isActive ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={user.id === currentUserId}
                    className={`px-3 py-1 rounded text-xs font-medium bg-white/10 text-red-400 border border-white/10 transition-colors ${
                      user.id === currentUserId
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-red-500/30 hover:bg-red-500/10"
                    }`}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A3F45] rounded-lg p-6 max-w-md w-full border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Crear Usuario</h2>
            <form onSubmit={createUser} className="space-y-3">
              <input
                type="text"
                placeholder="Nombre"
                value={newUserForm.name}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, name: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUserForm.email}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={newUserForm.password}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, password: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
                required
              />
              <input
                type="tel"
                placeholder="Teléfono (opcional)"
                value={newUserForm.phone}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none"
              />
              <select
                value={newUserForm.role}
                onChange={(e) =>
                  setNewUserForm({ ...newUserForm, role: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
              >
                <option value="PASSENGER">PASSENGER</option>
                <option value="ADMIN">ADMIN</option>
              </select>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#E5B869] text-[#2A3F45] font-semibold rounded hover:bg-[#d4a556] transition-colors"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
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

  // Bookings Section
  const BookingsSection = () => {
    const [search, setSearch] = useState("");
    const [searchType, setSearchType] = useState("all");
    const [page, setPage] = useState(1);
    const perPage = 10;

    const normalize = (s) => (s || "").toString().toLowerCase();

    const filtered = bookings.filter((b) => {
      if (!search.trim()) return true; // sin búsqueda, mostrar todo

      const q = search.trim().toLowerCase();
      const emailMatch = (b.user?.email || "").toLowerCase().includes(q);
      const passengerMatch = (b.user?.name || "").toLowerCase().includes(q);
      const idMatch = b.id?.toString().includes(q);
      const refMatch = `res-${b.id?.toString().padStart(6, "0")}`.includes(q);
      const routeMatch = (b.flights || []).some((rf) => {
        const orig = rf.flight?.origin?.code || "";
        const dest = rf.flight?.destination?.code || "";
        const route = `${orig}-${dest}`.toLowerCase();
        const routeSpace = `${orig} ${dest}`.toLowerCase();
        return (
          route.includes(q) ||
          routeSpace.includes(q) ||
          orig.toLowerCase().includes(q) ||
          dest.toLowerCase().includes(q)
        );
      });
      const ticketMatch = (b.tickets || []).some((t) => {
        if (t.id?.toString().includes(q)) return true;
        if ((t.ticketNumber || "").toLowerCase().includes(q)) return true;
        const tktId = t.id?.toString();
        if (q.replace("tkt#", "").replace("tkt", "") === tktId) return true;
        return false;
      });

      switch (searchType) {
        case "email":
          return emailMatch;
        case "passenger":
          return passengerMatch;
        case "id":
          return idMatch || refMatch || ticketMatch;
        case "route":
          return routeMatch;
        default:
          return (
            emailMatch ||
            passengerMatch ||
            idMatch ||
            refMatch ||
            routeMatch ||
            ticketMatch
          );
      }
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    const statusText = (s) =>
      s === "CONFIRMED"
        ? "Confirmado"
        : s === "PENDING"
          ? "Pendiente"
          : "Cancelado";

    const getBookingPlaceholder = () => {
      switch (searchType) {
        case "id":
          return "Buscar por ID (#482) o ticket";
        case "route":
          return "Buscar por ruta (BOG-LIM)";
        case "email":
          return "Buscar por email";
        case "passenger":
          return "Buscar por nombre de pasajero";
        default:
          return "Buscar por ID, ruta, ticket, email o pasajero";
      }
    };

    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-white">Todas las Reservas</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:outline-none text-sm w-full sm:w-44"
            >
              <option value="all">Buscar en todo</option>
              <option value="id">ID / Ticket</option>
              <option value="route">Ruta</option>
              <option value="email">Email</option>
              <option value="passenger">Pasajero</option>
            </select>
            <input
              placeholder={getBookingPlaceholder()}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-white/5 text-white rounded-lg border border-white/10 focus:outline-none w-full sm:w-72"
            />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-lg border border-white/10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/10">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                  Ref
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                  Pasajero
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                  Vuelos
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-200">
                  Pasajeros
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-200">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-gray-300">
                    RES-{booking.id.toString().padStart(6, "0")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {booking.user?.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {booking.user?.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    <div className="space-y-1">
                      {(booking.flights || []).map((rf, i) => {
                        const ticket = (booking.tickets || []).find(
                          (t) => t.flightId === rf.flightId,
                        );
                        const seatMatch =
                          ticket?.ticketNumber?.match(/TKT-([0-9A-Z]+)-/);
                        const seat = seatMatch ? seatMatch[1] : "—";
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-semibold text-white">
                              {rf.flight?.origin?.code}→
                              {rf.flight?.destination?.code}
                            </span>
                            {ticket && (
                              <span className="text-xs text-gray-400">
                                TKT#{ticket.id} · Asiento{" "}
                                <span className="text-[#E5B869]">{seat}</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-300">
                    {(booking.passengers || []).length}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="relative inline-block">
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        style={{ colorScheme: "dark" }}
                        className={`pl-3 pr-7 py-1 rounded text-xs font-semibold border focus:outline-none cursor-pointer appearance-none ${
                          booking.status === "CONFIRMED"
                            ? "bg-green-500/20 text-green-300 border-green-500/50"
                            : booking.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
                              : "bg-red-500/20 text-red-300 border-red-500/50"
                        }`}
                      >
                        <option value="CONFIRMED" style={{ backgroundColor: "#1a2a2f" }}>
                          Confirmado
                        </option>
                        <option value="PENDING" style={{ backgroundColor: "#1a2a2f" }}>
                          Pendiente
                        </option>
                        <option value="CANCELLED" style={{ backgroundColor: "#1a2a2f" }}>
                          Cancelado
                        </option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-1.5 flex items-center">
                        <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-right text-gray-300 font-semibold">
                    ${booking.totalPrice}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-300">
            Mostrando {start + 1} - {Math.min(start + perPage, filtered.length)}{" "}
            de {filtered.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              className="px-3 py-1 bg-white/5 text-white rounded disabled:opacity-50"
            >
              Anterior
            </button>
            <div className="text-sm text-gray-300">
              Página {current} de {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              className="px-3 py-1 bg-white/5 text-white rounded disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#2A3F45] overflow-hidden font-sans">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#1a2a2f] text-white flex flex-col shadow-2xl z-50 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 transition-transform duration-300`}
      >
        <div className="p-6 text-center border-b border-white/10">
          <h1 className="text-2xl font-bold text-[#E5B869]">AereoManage</h1>
          <p className="text-xs text-gray-400 mt-1">Panel Administrativo</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {["overview", "flights", "users", "bookings"].map((section) => (
            <button
              key={section}
              onClick={() => {
                setCurrentView(section);
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                currentView === section
                  ? "bg-[#E5B869] text-[#2A3F45] font-bold"
                  : "text-gray-300 hover:bg-white/10"
              }`}
            >
              {section === "overview" && "Resumen"}
              {section === "flights" && "Vuelos"}
              {section === "users" && "Usuarios"}
              {section === "bookings" && "Reservas"}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem("token");
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
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-300 hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
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
              {currentView === "overview" && <OverviewSection />}
              {currentView === "flights" && <FlightsSection />}
              {currentView === "users" && <UsersSection />}
              {currentView === "bookings" && <BookingsSection />}
            </>
          )}
        </main>
      </div>

      {/* Add Flight Modal */}
      {showAddFlightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#2A3F45] rounded-lg p-6 max-w-md w-full border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">
              Agregar Nuevo Vuelo
            </h2>
            <form onSubmit={createFlight} className="space-y-3">
              <select
                value={formData.airlineId}
                onChange={(e) =>
                  setFormData({ ...formData, airlineId: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                required
              >
                <option value="">Seleccionar Aerolínea</option>
                {airlines.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.originAirportId}
                onChange={(e) =>
                  setFormData({ ...formData, originAirportId: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                required
              >
                <option value="">Seleccionar Origen</option>
                {airports.map((ap) => (
                  <option key={ap.id} value={ap.id}>
                    {ap.city} ({ap.code})
                  </option>
                ))}
              </select>
              <select
                value={formData.destinationAirportId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    destinationAirportId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                required
              >
                <option value="">Seleccionar Destino</option>
                {airports.map((ap) => (
                  <option key={ap.id} value={ap.id}>
                    {ap.city} ({ap.code})
                  </option>
                ))}
              </select>
              <input
                type="datetime-local"
                value={formData.departureTime}
                onChange={(e) =>
                  setFormData({ ...formData, departureTime: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                required
              />
              <input
                type="datetime-local"
                value={formData.arrivalTime}
                onChange={(e) =>
                  setFormData({ ...formData, arrivalTime: e.target.value })
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none"
                required
              />
              <input
                type="number"
                placeholder="Precio"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
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
