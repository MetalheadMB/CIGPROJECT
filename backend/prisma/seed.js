import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  const users = [
    { email: 'admin@cig.dev', name: 'Aria Admin', role: 'ADMIN', clubName: 'Photography Club' },
    { email: 'photo@cig.dev', name: 'Pavan Photographer', role: 'PHOTOGRAPHER', clubName: 'Photography Club' },
    { email: 'member@cig.dev', name: 'Meera Member', role: 'CLUB_MEMBER', clubName: 'Photography Club' },
    { email: 'viewer@cig.dev', name: 'Vikram Viewer', role: 'VIEWER' },
  ];

  const created = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, name: u.name, clubName: u.clubName },
      create: { ...u, password },
    });
    created[u.role] = user;
    console.log(`  user ${u.email} (${u.role})`);
  }

  const events = [
    { name: 'Spring Cultural Fest 2026', category: 'Cultural', clubName: 'Photography Club', description: 'Annual cultural festival with performances and food stalls.' },
    { name: 'Hackathon Finale', category: 'Competition', clubName: 'Coding Club', description: '24-hour build sprint and demo day.' },
    { name: 'Himalaya Trek', category: 'Trip', clubName: 'Adventure Club', description: 'Five-day trek through the lower Himalayas.' },
  ];

  for (const e of events) {
    const exists = await prisma.event.findFirst({ where: { name: e.name } });
    if (exists) continue;
    const event = await prisma.event.create({
      data: {
        ...e,
        date: new Date(),
        visibility: 'PUBLIC',
        createdById: created.PHOTOGRAPHER.id,
      },
    });
    await prisma.album.create({
      data: { name: 'Highlights', eventId: event.id, createdById: created.PHOTOGRAPHER.id },
    });
    console.log(`  event ${e.name}`);
  }

  console.log('\nSeed complete. Login with any of:');
  users.forEach((u) => console.log(`  ${u.email} / password123  (${u.role})`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
