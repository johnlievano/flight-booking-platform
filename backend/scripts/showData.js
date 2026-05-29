/**
 * Script para mostrar datos disponibles
 * Uso: node scripts/showData.js
 */
import prisma from '../src/config/prisma.js';

async function showData() {
  try {
    console.log('\n🛫 AEROLÍNEAS:');
    const airlines = await prisma.airline.findMany();
    if (airlines.length === 0) {
      console.log('  ❌ No hay aerolíneas. Ejecuta: npm run seed');
    } else {
      airlines.forEach(a => console.log(`  ID: ${a.id} - ${a.name}`));
    }
    
    console.log('\n🛬 AEROPUERTOS:');
    const airports = await prisma.airport.findMany();
    if (airports.length === 0) {
      console.log('  ❌ No hay aeropuertos. Ejecuta: npm run seed');
    } else {
      airports.forEach(a => console.log(`  ID: ${a.id} - ${a.code} (${a.city}, ${a.country})`));
    }
    
    if (airlines.length === 0 || airports.length === 0) {
      console.log('\n⚠️  Necesitas ejecutar el seed:');
      console.log('  npm run seed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

showData();
