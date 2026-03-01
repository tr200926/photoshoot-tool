import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo workspace
  const workspace = await prisma.workspace.create({
    data: {
      id: 'demo-workspace-001',
      name: 'Demo Workspace',
      slug: 'demo-workspace',
      description: 'A demo workspace for testing',
      plan: 'pro',
      monthlyCredits: 10000,
    },
  });

  console.log(`Created workspace: ${workspace.name}`);

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@photoshoot.app',
      name: 'Demo User',
      password: hashedPassword,
      emailVerified: true,
      workspaces: {
        create: {
          workspaceId: workspace.id,
          role: 'admin',
        },
      },
    },
  });

  console.log(`Created user: ${user.email}`);
  console.log('✅ Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
