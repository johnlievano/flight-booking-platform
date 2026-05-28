/**
 * Script para crear el primer usuario administrador
 * Uso: node scripts/createAdmin.js
 */
import prisma from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   Crear Administrador de AeroManage   ║');
    console.log('╚════════════════════════════════════════╝\n');

    const name = await question('Nombre completo: ');
    const email = await question('Correo electrónico: ');
    const password = await question('Contraseña (mínimo 6 caracteres): ');
    const phone = await question('Teléfono (opcional): ');

    // Validaciones
    if (!name || !email || !password) {
      console.log('\n❌ Error: Nombre, email y contraseña son requeridos\n');
      rl.close();
      return;
    }

    if (password.length < 6) {
      console.log('\n❌ Error: La contraseña debe tener al menos 6 caracteres\n');
      rl.close();
      return;
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.log('\n❌ Error: El email ya está registrado\n');
      rl.close();
      return;
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario admin
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: 'ADMIN',
        isActive: true,
        avatarIndex: 0
      }
    });

    console.log('\n✅ ¡Administrador creado exitosamente!\n');
    console.log('Detalles:');
    console.log(`  ID: ${admin.id}`);
    console.log(`  Nombre: ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Rol: ${admin.role}`);
    console.log(`  Creado: ${admin.createdAt}\n`);

    rl.close();
  } catch (error) {
    console.error('\n❌ Error al crear administrador:', error.message);
    rl.close();
  } finally {
    await prisma.$disconnect();
  }
}

main();
