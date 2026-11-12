const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LAUNCH_PERSONAS = [
  // ---------------- BHOPAL FEMALE ----------------
  {
    phone: "+919800000101",
    name: "Aarohi Saxena",
    age: 24,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Bhopal",
    profession: "Architect & Spatial Designer",
    education: "MANIT Bhopal",
    height: 165,
    bio: "Passionate about heritage architecture, specialty brews, and sunset drives around Upper Lake. Looking for genuine chemistry.",
    intention: "LONG_TERM",
    promptQ: "My ideal Sunday in Bhopal looks like...",
    promptA: "Morning run by the lake followed by iced mocha and indie playlists at a cozy rooftop.",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
    ],
  },
  {
    phone: "+919800000102",
    name: "Kritika Joshi",
    age: 25,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Bhopal",
    profession: "Brand Strategist & Podcaster",
    education: "Barkatullah University",
    height: 168,
    bio: "Storyteller by day, aspiring baker on weekends. Up for live comedy, deep midnight conversations, and TMD mixer events.",
    intention: "SHORT_TERM_CASUAL",
    promptQ: "The way to win me over is...",
    promptA: "Surprise me with witty humor and a great playlist recommendation.",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
    ],
  },
  {
    phone: "+919800000103",
    name: "Simran Bhargava",
    age: 23,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Bhopal",
    profession: "UI/UX Product Designer",
    education: "NID / Design Graduate",
    height: 162,
    bio: "Minimalist aesthetic, maximalist foodie. Love exploring hidden cafes in Arera Hills and vinyl record shops.",
    intention: "LONG_TERM",
    promptQ: "I get irrationally excited about...",
    promptA: "Art galleries, aesthetic packaging, and perfectly brewed flat whites.",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800",
    ],
  },
  {
    phone: "+919800000104",
    name: "Ananya Dixit",
    age: 26,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Bhopal",
    profession: "Clinical Psychologist",
    education: "Delhi University / Clinical Masters",
    height: 166,
    bio: "Empathetic listener, amateur potter, and weekend trail runner. Seeking someone grounded with good emotional bandwidth.",
    intention: "LONG_TERM",
    promptQ: "Together, we could...",
    promptA: "Plan spontaneous weekend trips to Pachmarhi and exchange book recommendations.",
    photos: [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    ],
  },

  // ---------------- INDORE FEMALE ----------------
  {
    phone: "+919800000105",
    name: "Radhika Agrawal",
    age: 25,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Indore",
    profession: "Fintech Product Manager",
    education: "IIM Indore (IPM)",
    height: 167,
    bio: "Indori foodie with an obsession for 56 Dukan and Sarafa. Work hard, explore harder. Let's grab drinks at a rooftop mixer!",
    intention: "SHORT_TERM_CASUAL",
    promptQ: "Best perk of dating me...",
    promptA: "I know the best food spots in Indore that aren't on TripAdvisor.",
    photos: [
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
    ],
  },
  {
    phone: "+919800000106",
    name: "Meghna Chouhan",
    age: 24,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Indore",
    profession: "Fashion & Lifestyle Stylist",
    education: "NIFT Mumbai",
    height: 170,
    bio: "Lover of slow fashion, indie cinema, and weekend pottery. Believer in spark over small talk.",
    intention: "LONG_TERM",
    promptQ: "My simple pleasures...",
    promptA: "Scented candles, handwritten postcards, and live acoustic music.",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
    ],
  },
  {
    phone: "+919800000107",
    name: "Palak Trivedi",
    age: 26,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Indore",
    profession: "Content Creator & Marketer",
    education: "Symbiosis Pune",
    height: 164,
    bio: "Obsessed with sunsets, good lighting, and specialty pour-overs. Ready to meet someone genuine who matches my energy.",
    intention: "SHORT_TERM_CASUAL",
    promptQ: "We'll get along if...",
    promptA: "You don't take life too seriously and appreciate spontaneous weekend road trips.",
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
    ],
  },
  {
    phone: "+919800000108",
    name: "Tanvi Soni",
    age: 27,
    gender: "FEMALE",
    interestedIn: "MEN",
    city: "Indore",
    profession: "Dentist & Wellness Enthusiast",
    education: "MGM Indore",
    height: 165,
    bio: "Balancing clinical rounds with pilates & specialty coffee. Looking for kindness, ambition, and good vibes.",
    intention: "LONG_TERM",
    promptQ: "Dating me is like...",
    promptA: "Having your personal cheerleader, coffee partner, and emergency plus-one.",
    photos: [
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=800",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
    ],
  },

  // ---------------- BHOPAL MALE ----------------
  {
    phone: "+919800000109",
    name: "Kabir Roy",
    age: 27,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Bhopal",
    profession: "Software Engineering Lead",
    education: "NIT Bhopal",
    height: 180,
    bio: "Building tech products, running half marathons, and hunting for the best cold brew in town. Let's catch a TMD event this Friday.",
    intention: "LONG_TERM",
    promptQ: "I'll pick the place if you...",
    promptA: "Promise to pick the music for the drive back.",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800",
    ],
  },
  {
    phone: "+919800000110",
    name: "Devansh Rathore",
    age: 28,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Bhopal",
    profession: "Organic Cafe & Roastery Owner",
    education: "IHM Aurangabad",
    height: 183,
    bio: "Passionate about specialty coffee, rooftop gigs, and sourdough. Down to earth, ambitious, and looking for something real.",
    intention: "LONG_TERM",
    promptQ: "A life goal of mine is...",
    promptA: "To open a greenhouse roastery overlooking Upper Lake and travel South America.",
    photos: [
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    ],
  },
  {
    phone: "+919800000111",
    name: "Aditya Verma",
    age: 26,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Bhopal",
    profession: "Wildlife Documentary Filmmaker",
    education: "FTII Pune",
    height: 178,
    bio: "Spending time between editing bays and Van Vihar / Satpura jungles. Love candid storytelling, vinyl, and chai stalls.",
    intention: "SHORT_TERM_CASUAL",
    promptQ: "Two truths and a lie...",
    promptA: "I've photographed tigers in the wild, I can cook authentic butter chicken, and I don't know how to ride a bike.",
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
    ],
  },
  {
    phone: "+919800000112",
    name: "Siddharth Malviya",
    age: 29,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Bhopal",
    profession: "Corporate Lawyer",
    education: "NLIU Bhopal",
    height: 182,
    bio: "Contract negotiator by week, acoustic guitar strummer by weekend. Big on thoughtful dates and great cocktail bars.",
    intention: "LONG_TERM",
    promptQ: "Best travel story...",
    promptA: "Getting stuck on a Himalayan pass and sharing maggi with monks at 14,000 feet.",
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
    ],
  },

  // ---------------- INDORE MALE ----------------
  {
    phone: "+919800000113",
    name: "Yashvardhan Jain",
    age: 27,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Indore",
    profession: "D2C Brand Founder",
    education: "NMIMS Mumbai",
    height: 181,
    bio: "Startup hustle balanced with pickleball & techno gigs. Looking for a partner in crime who loves ambition and great vibes.",
    intention: "LONG_TERM",
    promptQ: "First round of drinks is on me if...",
    promptA: "You can beat me at badminton or guess my favorite Indori food joint.",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
    ],
  },
  {
    phone: "+919800000114",
    name: "Rohan Kulkarni",
    age: 28,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Indore",
    profession: "Orthopedic Surgeon & Crossfit Athlete",
    education: "GMC Indore",
    height: 185,
    bio: "Dedicated doctor with a passion for fitness and outdoor cycling. Big believer that shared values matter more than small talk.",
    intention: "LONG_TERM",
    promptQ: "A non-negotiable for me is...",
    promptA: "Empathy, clear communication, and respecting each other's passions.",
    photos: [
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800",
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800",
    ],
  },
  {
    phone: "+919800000115",
    name: "Varun Mehta",
    age: 26,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Indore",
    profession: "Creative Director & Photographer",
    education: "Symbiosis Institute of Design",
    height: 179,
    bio: "Visual storyteller, music festival regular, and proud dog dad. Let's explore a new cafe or catch an acoustic live jam.",
    intention: "SHORT_TERM_CASUAL",
    promptQ: "I'll know we click when...",
    promptA: "We lose track of time talking about weird childhood obsessions.",
    photos: [
      "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=800",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    ],
  },
  {
    phone: "+919800000116",
    name: "Arjun Singhal",
    age: 29,
    gender: "MALE",
    interestedIn: "WOMEN",
    city: "Indore",
    profession: "Venture Capital Analyst",
    education: "IIT Delhi / IIM",
    height: 184,
    bio: "Evaluating tech startups by day, playing guitar by night. Looking for someone genuine and intellectually curious.",
    intention: "LONG_TERM",
    promptQ: "My favorite conversation starter...",
    promptA: "What's something you changed your mind about recently?",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800",
    ],
  },
];

async function seedLaunchProfiles() {
  console.log("Seeding 16 curated launch profiles for Bhopal & Indore into production database...");
  let createdCount = 0;
  let updatedCount = 0;

  for (const p of LAUNCH_PERSONAS) {
    const existing = await prisma.user.findFirst({
      where: { phone: p.phone },
      include: { profile: true },
    });

    const dob = new Date(Date.now() - p.age * 365.25 * 24 * 60 * 60 * 1000);

    if (existing) {
      if (existing.profile) {
        await prisma.profile.update({
          where: { id: existing.profile.id },
          data: {
            name: p.name,
            dob,
            age: p.age,
            gender: p.gender,
            interestedIn: p.interestedIn,
            city: p.city,
            profession: p.profession,
            education: p.education,
            height: p.height,
            bio: p.bio,
            relationshipIntention: p.intention,
            promptQuestion: p.promptQ,
            promptAnswer: p.promptA,
          },
        });
      }
      updatedCount++;
      console.log(`  ↻ Updated: ${p.name} (${p.city}, ${p.gender})`);
    } else {
      const user = await prisma.user.create({
        data: {
          phone: p.phone,
          status: "ACTIVE",
          isVerified: true,
          profile: {
            create: {
              name: p.name,
              dob,
              age: p.age,
              gender: p.gender,
              interestedIn: p.interestedIn,
              city: p.city,
              profession: p.profession,
              education: p.education,
              height: p.height,
              bio: p.bio,
              relationshipIntention: p.intention,
              promptQuestion: p.promptQ,
              promptAnswer: p.promptA,
              photos: {
                create: p.photos.map((url, idx) => ({
                  storageKey: `launch_profiles/${p.name.replace(/\\s+/g, "_")}_${idx}.jpg`,
                  url,
                  order: idx,
                  isPrimary: idx === 0,
                  status: "APPROVED",
                })),
              },
            },
          },
        },
      });

      const freePlan = await prisma.plan.findUnique({ where: { code: "FREE" } });
      if (freePlan) {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            planId: freePlan.id,
            status: "ACTIVE",
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          },
        });
      }

      createdCount++;
      console.log(`  ✓ Created: ${p.name} (${p.city}, ${p.gender}, Age ${p.age})`);
    }
  }

  console.log(`COMPLETED: ${createdCount} created, ${updatedCount} updated.`);
  await prisma.$disconnect();
}

seedLaunchProfiles().catch((err) => {
  console.error("Error seeding launch profiles:", err);
  process.exit(1);
});
