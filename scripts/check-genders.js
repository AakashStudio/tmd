const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      name: true,
      gender: true,
      interestedIn: true,
      userId: true
    }
  });
  console.log("Total profiles:", profiles.length);
  console.log(JSON.stringify(profiles, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
