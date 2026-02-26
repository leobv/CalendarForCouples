const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Space "Casa"
  const space = await prisma.space.create({
    data: {
      name: 'Casa',
    },
  });
  console.log(`Created space with id: ${space.id}`);

  // Create Users
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const leandro = await prisma.user.create({
    data: {
      name: 'Leandro',
      email: 'leandro@test.com',
      password: hashedPassword,
      spaceId: space.id,
    },
  });
  console.log(`Created user Leandro with id: ${leandro.id}`);

  const gabi = await prisma.user.create({
    data: {
      name: 'Gabi',
      email: 'gabi@test.com',
      password: hashedPassword,
      spaceId: space.id,
    },
  });
  console.log(`Created user Gabi with id: ${gabi.id}`);

  // Create Event
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const event = await prisma.event.create({
    data: {
      title: 'Turno pediatra Antonia',
      dateStart: tomorrow,
      spaceId: space.id,
      createdBy: leandro.id,
    },
  });
  console.log(`Created event with id: ${event.id}`);

  // Create Shopping List Items
  const items = [
    'Galletitas',
    'Jabón de manos',
    'Hamburguesas',
    'Yogur',
    'Papas',
    'Huevos',
    'Rollo de cocina',
    'Pechuga de pollo',
    'Leche deslactosada',
  ];

  for (const content of items) {
    await prisma.listItem.create({
      data: {
        content,
        spaceId: space.id,
      },
    });
  }
  console.log(`Created ${items.length} shopping list items.`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
