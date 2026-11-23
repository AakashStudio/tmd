import { prisma } from "../src/lib/db";

async function main() {
  const profiles = await prisma.profile.findMany({
    where: { voicePromptUrl: { not: null } },
    select: {
      id: true,
      name: true,
      voicePromptUrl: true,
      voicePromptDuration: true,
    },
  });
  console.log("Found profiles with voice notes:", profiles.length);
  for (const p of profiles) {
    console.log(`User: ${p.name}`);
    console.log(`URL: ${p.voicePromptUrl}`);
    console.log(`Duration: ${p.voicePromptDuration}`);
    console.log("-------------------");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
