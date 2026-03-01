/*
  Script de Inicializacion de Asientos (Seed)
  Este script recorre todos los vuelos existentes en la base de datos y les 
  Simula una ocupacion aleatoria del 20% para propositos de prueba.
*/

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando configuracion de cabinas de asientos...");
    
    // Se obtienen todos los vuelos registrados en la base de datos
    const flights = await prisma.flight.findMany();
    let totalSeatsCreated = 0;

    for (const flight of flights) {
        // Se verifica la existencia previa de asientos para evitar duplicar registros
        const existingSeats = await prisma.seat.count({ where: { flightId: flight.id } });
        
        if (existingSeats === 0) {
            const seatsToCreate = [];
            const rows = 10;
            const cols = ['A', 'B', 'C', 'D'];

            // Generacion de la matriz de asientos (ej. 1A, 1B, 2A...)
            for (let r = 1; r <= rows; r++) {
                for (const c of cols) {
                    seatsToCreate.push({
                        number: `${r}${c}`,
                        // Distribucion probabilistica: 20% ocupado, 80% libre
                        isOccupied: Math.random() > 0.8, 
                        flightId: flight.id
                    });
                }
            }

            // Insercion masiva en la base de datos para optimizar el rendimiento
            await prisma.seat.createMany({ data: seatsToCreate });
            totalSeatsCreated += seatsToCreate.length;
            console.log(`Asientos generados correctamente para el vuelo ID: ${flight.id}`);
        }
    }
    console.log(`Proceso finalizado. Total de asientos creados en la base de datos: ${totalSeatsCreated}`);
}

main()
  .catch((e) => console.error("Error durante la ejecucion:", e))
  .finally(async () => await prisma.$disconnect());