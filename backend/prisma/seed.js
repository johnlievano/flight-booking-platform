import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log(' Generando red de vuelos perfectamente simétrica...');

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

  const nuevosVuelos = [];
  let fechaBase = new Date();
  fechaBase.setDate(fechaBase.getDate() + 5);
  fechaBase.setHours(0, 0, 0, 0);

  // Generar combinaciones para TODAS las ciudades entre sí
  for (let i = 0; i < ciudades.length; i++) {
    for (let j = 0; j < ciudades.length; j++) {
      if (i !== j) { // No crear vuelos de una ciudad a sí misma
        const originId = aeropuertosDB[ciudades[i].code];
        const destId = aeropuertosDB[ciudades[j].code];
        const precioBase = Math.floor(Math.random() * (250000 - 120000 + 1) + 120000); // Precio aleatorio entre 120k y 250k

        // VUELO AM
        let salidaAM = new Date(fechaBase); salidaAM.setHours(8, 0, 0);
        let llegadaAM = new Date(salidaAM); llegadaAM.setHours(9, 30, 0);
        nuevosVuelos.push({
          airlineId: airline.id, originAirportId: originId, destinationAirportId: destId,
          departureTime: salidaAM, arrivalTime: llegadaAM, price: precioBase, totalSeats: 150, availableSeats: 150, status: 'SCHEDULED'
        });

        // VUELO PM
        let salidaPM = new Date(fechaBase); salidaPM.setHours(15, 0, 0);
        let llegadaPM = new Date(salidaPM); llegadaPM.setHours(16, 30, 0);
        nuevosVuelos.push({
          airlineId: airline.id, originAirportId: originId, destinationAirportId: destId,
          departureTime: salidaPM, arrivalTime: llegadaPM, price: precioBase + 45000, totalSeats: 150, availableSeats: 150, status: 'SCHEDULED'
        });
      }
    }
  }

  await prisma.flight.createMany({ data: nuevosVuelos });
  console.log(` ¡Éxito! Se crearon ${nuevosVuelos.length} vuelos (Ida y Vuelta para TODAS las rutas).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());