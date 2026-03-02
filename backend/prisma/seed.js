import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log(' Limpiando vuelos y asientos viejos...');
  // Limpiamos en orden para no romper relaciones
  await prisma.seat.deleteMany();
  await prisma.flight.deleteMany();

  let airline = await prisma.airline.findFirst();
  if (!airline) {
    airline = await prisma.airline.create({ data: { name: 'Intouch Airlines', code: 'ITA' } });
  }

  const ciudades = [
    { city: 'Bogotá', code: 'BOG' }, { city: 'Medellín', code: 'MDE' },
    { city: 'Cartagena', code: 'CTG' }, { city: 'Cali', code: 'CLO' },
    { city: 'Santa Marta', code: 'SMR' }
  ];

  const aeropuertosDB = {};
  for (const c of ciudades) {
    let airport = await prisma.airport.findFirst({ where: { code: c.code } });
    if (!airport) { airport = await prisma.airport.create({ data: c }); }
    aeropuertosDB[c.code] = airport.id;
  }

  console.log('✈️ Generando red de vuelos masiva (7 días en el futuro)...');
  const nuevosVuelos = [];
  let fechaBase = new Date();
  fechaBase.setHours(0, 0, 0, 0); // Empezamos desde la medianoche de hoy

  // Generar vuelos para HOY y los próximos 6 días
  for (let dias = 0; dias < 7; dias++) {
    let fechaVuelo = new Date(fechaBase);
    fechaVuelo.setDate(fechaVuelo.getDate() + dias);

    for (let i = 0; i < ciudades.length; i++) {
      for (let j = 0; j < ciudades.length; j++) {
        if (i !== j) {
          const originId = aeropuertosDB[ciudades[i].code];
          const destId = aeropuertosDB[ciudades[j].code];
          const precioBase = Math.floor(Math.random() * (250000 - 120000 + 1) + 120000);

          // 1. VUELO AM (8:00 AM)
          let salidaAM = new Date(fechaVuelo); salidaAM.setHours(8, 0, 0);
          let llegadaAM = new Date(salidaAM); llegadaAM.setHours(9, 30, 0);
          nuevosVuelos.push({
            airlineId: airline.id, originAirportId: originId, destinationAirportId: destId,
            departureTime: salidaAM, arrivalTime: llegadaAM, price: precioBase, totalSeats: 40, status: 'SCHEDULED'
          });

          // 2. VUELO PM (3:00 PM)
          let salidaPM = new Date(fechaVuelo); salidaPM.setHours(15, 0, 0);
          let llegadaPM = new Date(salidaPM); llegadaPM.setHours(16, 30, 0);
          nuevosVuelos.push({
            airlineId: airline.id, originAirportId: originId, destinationAirportId: destId,
            departureTime: salidaPM, arrivalTime: llegadaPM, price: precioBase + 45000, totalSeats: 40, status: 'SCHEDULED'
          });

          // 3. VUELO NOCHE (9:00 PM)
          let salidaNoche = new Date(fechaVuelo); salidaNoche.setHours(21, 0, 0);
          let llegadaNoche = new Date(salidaNoche); llegadaNoche.setHours(22, 30, 0);
          nuevosVuelos.push({
            airlineId: airline.id, originAirportId: originId, destinationAirportId: destId,
            departureTime: salidaNoche, arrivalTime: llegadaNoche, price: Math.max(100000, precioBase - 30000), totalSeats: 40, status: 'SCHEDULED'
          });
        }
      }
    }
  }

  await prisma.flight.createMany({ data: nuevosVuelos });
  console.log(`✅ ¡Éxito! Se crearon ${nuevosVuelos.length} vuelos.`);

  console.log('💺 Generando mapa de asientos (con pasajeros aleatorios)... Esto tomará unos segundos.');
  const todosLosVuelos = await prisma.flight.findMany();
  const asientosData = [];

  for (const vuelo of todosLosVuelos) {
    for (let row = 1; row <= 10; row++) {
      for (const letter of ['A', 'B', 'C', 'D']) {
        asientosData.push({
          flightId: vuelo.id,
          number: `${row}${letter}`,
          isOccupied: Math.random() < 0.3 // 30% de probabilidad de que alguien ya haya comprado este asiento
        });
      }
    }
  }

  // Insertamos los asientos en lotes para no saturar la base de datos
  const chunkSize = 4000;
  for (let i = 0; i < asientosData.length; i += chunkSize) {
    const chunk = asientosData.slice(i, i + chunkSize);
    await prisma.seat.createMany({ data: chunk });
  }

  console.log(`✅ ¡Éxito! Se crearon ${asientosData.length} asientos interactivos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());