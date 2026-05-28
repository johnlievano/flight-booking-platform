import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando datos anteriores...');
  
  // Limpiar en orden para no romper relaciones
  await prisma.ticket.deleteMany();
  await prisma.seat.deleteMany();
  await prisma.reservationFlight.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.airline.deleteMany();
  await prisma.airport.deleteMany();

  console.log('✈️ Creando aerolínea...');
  const airline = await prisma.airline.create({
    data: { name: 'AeroManage', code: 'AMG' }
  });

  // Definir rutas internacionales principales desde Bogotá
  const routes = [
    { origin: { city: 'Bogotá', code: 'BOG' }, destination: { city: 'Miami', code: 'MIA' }, duration: 3 },
    { origin: { city: 'Bogotá', code: 'BOG' }, destination: { city: 'Madrid', code: 'MAD' }, duration: 9 },
    { origin: { city: 'Bogotá', code: 'BOG' }, destination: { city: 'Ciudad de México', code: 'MEX' }, duration: 2.5 },
    { origin: { city: 'Bogotá', code: 'BOG' }, destination: { city: 'Nueva York', code: 'NYC' }, duration: 4 },
    { origin: { city: 'Bogotá', code: 'BOG' }, destination: { city: 'Lima', code: 'LIM' }, duration: 1.5 },
    // Rutas adicionales para variedad
    { origin: { city: 'Miami', code: 'MIA' }, destination: { city: 'Bogotá', code: 'BOG' }, duration: 3 },
    { origin: { city: 'Madrid', code: 'MAD' }, destination: { city: 'Bogotá', code: 'BOG' }, duration: 9 },
    { origin: { city: 'Nueva York', code: 'NYC' }, destination: { city: 'Bogotá', code: 'BOG' }, duration: 4 },
  ];

  console.log('🏙️ Creando aeropuertos...');
  const airportMap = {};
  const uniqueAirports = new Map();

  for (const route of routes) {
    [route.origin, route.destination].forEach(airport => {
      if (!uniqueAirports.has(airport.code)) {
        uniqueAirports.set(airport.code, airport);
      }
    });
  }

  for (const [code, airport] of uniqueAirports) {
    let dbAirport = await prisma.airport.findFirst({ where: { code } });
    if (!dbAirport) {
      dbAirport = await prisma.airport.create({ data: airport });
    }
    airportMap[code] = dbAirport.id;
  }

  console.log('📅 Generando vuelos para todo el año 2025-2026...');
  
  const flightsData = [];
  
  // Definir horarios de salida (06:00, 12:00, 18:00)
  const departureHours = [6, 12, 18];
  
  // Generar vuelos desde 1 de Enero 2025 hasta 31 de Diciembre 2026
  const startDate = new Date(2025, 0, 1); // 1 de Enero 2025
  const endDate = new Date(2026, 11, 31); // 31 de Diciembre 2026
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Generar 3 vuelos por día para cada ruta
    for (const route of routes) {
      for (const hour of departureHours) {
        const departure = new Date(currentDate);
        departure.setHours(hour, 0, 0, 0);
        
        const arrival = new Date(departure);
        arrival.setHours(
          Math.floor(hour + route.duration),
          Math.floor((route.duration % 1) * 60),
          0,
          0
        );
        
        // Precios dinámicos (más caros en fines de semana)
        const basePriceEconomy = 120000 + Math.random() * 150000;
        const basePriceBusiness = basePriceEconomy * 2.5;
        
        const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.3 : 1;
        const timeMultiplier = hour === 6 ? 0.9 : hour === 12 ? 1 : 1.1; // Vuelos nocturnos más caros
        
        const economyPrice = Math.round(basePriceEconomy * weekendMultiplier * timeMultiplier);
        const businessPrice = Math.round(basePriceBusiness * weekendMultiplier * timeMultiplier);
        
        flightsData.push({
          airlineId: airline.id,
          originAirportId: airportMap[route.origin.code],
          destinationAirportId: airportMap[route.destination.code],
          departureTime: departure,
          arrivalTime: arrival,
          price: economyPrice, // Guardamos el precio de economía
          totalSeats: 150, // 120 economy + 30 business
          status: 'ON_TIME'
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`📊 Total de vuelos a crear: ${flightsData.length}`);
  
  // Insertar vuelos en lotes de 100 para optimización
  const flightBatchSize = 100;
  for (let i = 0; i < flightsData.length; i += flightBatchSize) {
    const batch = flightsData.slice(i, i + flightBatchSize);
    await prisma.flight.createMany({ data: batch });
    process.stdout.write(`\r✈️ Vuelos creados: ${Math.min(i + flightBatchSize, flightsData.length)}/${flightsData.length}`);
  }
  console.log('');

  console.log('💺 Generando asientos para todos los vuelos...');
  const allFlights = await prisma.flight.findMany();
  const seatsData = [];

  for (const flight of allFlights) {
    const economyCount = 120;
    const businessCount = 30;

    // Asientos de economía (1A-1F, 2A-2F, etc.)
    for (let row = 1; row <= 20; row++) {
      for (let col = 0; col < 6; col++) {
        const seatLetter = String.fromCharCode(65 + col);
        seatsData.push({
          flightId: flight.id,
          number: `${row}${seatLetter}`,
          isOccupied: false
        });
      }
    }

    // Asientos de negocios (1A-1D Business, 2A-2D Business, etc.)
    for (let row = 1; row <= 8; row++) {
      for (let col = 0; col < 4; col++) {
        const seatLetter = String.fromCharCode(65 + col);
        seatsData.push({
          flightId: flight.id,
          number: `${row}${seatLetter}B`, // B para indicar Business
          isOccupied: false
        });
      }
    }
  }

  // Insertar asientos en lotes de 500 para optimización
  const seatBatchSize = 500;
  for (let i = 0; i < seatsData.length; i += seatBatchSize) {
    const batch = seatsData.slice(i, i + seatBatchSize);
    await prisma.seat.createMany({ data: batch });
    process.stdout.write(`\r💺 Asientos creados: ${Math.min(i + seatBatchSize, seatsData.length)}/${seatsData.length}`);
  }
  console.log('');

  console.log('\n✅ ¡Seed completado exitosamente!');
  console.log(`📊 Estadísticas:`);
  console.log(`   - Aerolíneas: 1`);
  console.log(`   - Aeropuertos: ${uniqueAirports.size}`);
  console.log(`   - Rutas: ${routes.length}`);
  console.log(`   - Vuelos: ${flightsData.length}`);
  console.log(`   - Asientos: ${seatsData.length}`);
}

main()
  .catch((error) => {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });