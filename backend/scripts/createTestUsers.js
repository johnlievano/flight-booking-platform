/**
 * Script para crear usuarios de prueba rápidamente
 * Uso: node scripts/createTestUsers.js
 */
import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';

async function createTestUsers() {
  try {
    console.log('\n🚀 Creando usuarios de prueba...\n');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const testUsers = [
      {
        name: 'Juan Pérez',
        email: 'juan@test.com',
        password: hashedPassword,
        phone: '3001234567',
        role: 'PASSENGER',
        isActive: true,
        avatarIndex: 1
      },
      {
        name: 'María García',
        email: 'maria@test.com',
        password: hashedPassword,
        phone: '3009876543',
        role: 'PASSENGER',
        isActive: true,
        avatarIndex: 2
      },
      {
        name: 'Carlos López',
        email: 'carlos@test.com',
        password: hashedPassword,
        phone: '3005556666',
        role: 'PASSENGER',
        isActive: false,
        avatarIndex: 3
      },
      {
        name: 'Ana Rodríguez',
        email: 'ana@test.com',
        password: hashedPassword,
        phone: '3007778888',
        role: 'ADMIN',
        isActive: true,
        avatarIndex: 4
      }
    ];

    for (const userData of testUsers) {
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existing) {
        console.log(`⚠️  ${userData.email} ya existe, saltando...`);
        continue;
      }

      const user = await prisma.user.create({
        data: userData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true
        }
      });

      console.log(`✅ Creado: ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Activo' : 'Inactivo'}`);
    }

    console.log('\n🎉 Usuarios de prueba creados exitosamente!');
    console.log('\nCredenciales para login:');
    console.log('  Email: juan@test.com');
    console.log('  Password: password123');
    console.log('\n  Email: maria@test.com');
    console.log('  Password: password123');
    console.log('\n  Email: carlos@test.com');
    console.log('  Password: password123 (Inactivo)');
    console.log('\n  Email: ana@test.com');
    console.log('  Password: password123 (Admin)\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
