import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const main = async () => {
  const user = await prisma.user.upsert({
    create: {
      username: 'admin',
      email: 'admin@email.com',
      password: 'admin123',
    },
    where: { username: 'admin' },
    update: {},
  });
};
