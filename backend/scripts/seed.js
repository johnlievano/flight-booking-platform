/**
 * Script para poblar la base de datos con datos iniciales
 * Uso: node scripts/seed.js
 */
import prisma from '../src/config/prisma.js';

async function seed() {
  try {
    console.log('\n🌱 Poblando base de datos...\n');

    // Aerolíneas (solo id, name, code según schema)
    const airlines = await prisma.airline.createMany({
      data: [
        { id: 1, name: 'AeroManage', code: 'AMG' },
        { id: 2, name: 'Avianca', code: 'AVA' },
        { id: 3, name: 'LATAM', code: 'LAT' }
      ],
      skipDuplicates: true
    });
    console.log(`✅ ${airlines.count} aerolíneas creadas`);

    // Aeropuertos (solo id, city, code según schema)
    const airports = await prisma.airport.createMany({
      data: [
        { id: 1, city: 'Bogotá', code: 'BOG' },
        { id: 2, city: 'Miami', code: 'MIA' },
        { id: 3, city: 'Medellín', code: 'MDE' },
        { id: 4, city: 'Cartagena', code: 'CTG' }
      ],
      skipDuplicates: true
    });
    console.log(`✅ ${airports.count} aeropuertos creados`);

    console.log('\n📋 Datos para crear vuelos:');
    console.log('  Airline ID: 1 (AeroManage), 2 (Avianca), 3 (LATAM)');
    console.log('  Origin Airport ID: 1 (BOG), 3 (MDE), 4 (CTG)');
    console.log('  Destination Airport ID: 2 (MIA), 1 (BOG)');
    console.log('\n🎉 Base de datos poblada exitosamente!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
