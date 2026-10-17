const { PrismaClient, PlanCode, RelationshipIntention, PhotoStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting script: Add 5 Girls to Chat & Upgrade to TMD PRO...");

  // 1. Get the PRO plan
  const proPlan = await prisma.plan.findUnique({
    where: { code: PlanCode.PRO_499 },
  });

  if (!proPlan) {
    throw new Error("PRO_499 plan not found in database.");
  }

  // 2. Find real users (non-seed/latest registered)
  const allUsers = await prisma.user.findMany({
    include: {
      profile: true,
      subscriptions: { include: { plan: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`Found ${allUsers.length} total users in DB.`);

  // Find users that are real candidates for upgrade
  const realUsers = allUsers.filter(
    (u) =>
      u.phone &&
      !u.phone.startsWith("+91987654321") &&
      !u.phone.startsWith("+9100000000")
  );

  // If no user outside the seed range is found, take the most recent user
  const targetUsers = realUsers.length > 0 ? realUsers : [allUsers[0]];

  console.log("Upgrading target user(s) to PRO_499:");
  for (const tu of targetUsers) {
    console.log(`- User ID: ${tu.id}, Phone: ${tu.phone || tu.email}, Name: ${tu.profile?.name || "Anonymous"}`);

    // Create or update active subscription with 30 days validity
    const startDate = new Date();
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Cancel old subscriptions
    await prisma.subscription.updateMany({
      where: { userId: tu.id, status: "ACTIVE" },
      data: { status: "EXPIRED" },
    });

    // Create new PRO subscription
    await prisma.subscription.create({
      data: {
        userId: tu.id,
        planId: proPlan.id,
        status: "ACTIVE",
        startDate,
        endDate,
      },
    });

    // Ensure user status is ACTIVE and verified
    await prisma.user.update({
      where: { id: tu.id },
      data: {
        isVerified: true,
        status: "ACTIVE",
      },
    });
    console.log(`  ✓ Upgraded ${tu.phone || tu.id} to ₹499 PRO (Valid 30 days)`);
  }

  const primaryTargetUser = targetUsers[0];

  // 3. Define 5 Girls for Chatting UI Testing
  const girlsData = [
    {
      phone: "+919999000001",
      email: "aanya.sharma@tmd.internal",
      name: "Aanya Sharma",
      age: 23,
      dob: new Date("2003-04-12"),
      gender: "Female",
      interestedIn: "Male",
      city: "Delhi",
      latitude: 28.5494,
      longitude: 77.2001,
      bio: "Architect & coffee lover ☕ Art galleries, design, and spontaneous weekend road trips ✨",
      profession: "Architect",
      education: "SPA Delhi",
      height: 168,
      intention: RelationshipIntention.LONG_TERM,
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800",
      firstMessage: "Hey there! Loved your profile 😊 How is your weekend going?",
      secondMessage: "Was thinking of checking out this new art exhibit in Hauz Khas. You like art?",
    },
    {
      phone: "+919999000002",
      email: "riya.kapoor@tmd.internal",
      name: "Riya Kapoor",
      age: 24,
      dob: new Date("2002-09-18"),
      gender: "Female",
      interestedIn: "Male",
      city: "Delhi",
      latitude: 28.5355,
      longitude: 77.2100,
      bio: "Fashion stylist & foodie. Always on the hunt for the best rooftop cafes 🌇",
      profession: "Fashion Stylist",
      education: "NIFT Delhi",
      height: 165,
      intention: RelationshipIntention.LONG_TERM,
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800",
      firstMessage: "Hey! That cafe in your photos looks so cool, where was it taken?",
      secondMessage: "I'm such a sucker for good rooftop views and iced Americano haha ☕",
    },
    {
      phone: "+919999000003",
      email: "sneha.patel@tmd.internal",
      name: "Sneha Patel",
      age: 22,
      dob: new Date("2004-01-25"),
      gender: "Female",
      interestedIn: "Male",
      city: "Delhi",
      latitude: 28.6139,
      longitude: 77.2090,
      bio: "Tech & design geek by day, indie music lover by night 🎧 Let's vibe!",
      profession: "UI/UX Designer",
      education: "DTU Delhi",
      height: 162,
      intention: RelationshipIntention.LONG_TERM,
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800",
      firstMessage: "Hi! We both love indie music 🎶 Have you listened to Prateek Kuhad's latest track?",
      secondMessage: "Looking for someone with great taste in playlists! Send me your top song right now 🎧",
    },
    {
      phone: "+919999000004",
      email: "pooja.verma@tmd.internal",
      name: "Pooja Verma",
      age: 25,
      dob: new Date("2001-06-14"),
      gender: "Female",
      interestedIn: "Male",
      city: "Delhi",
      latitude: 28.5700,
      longitude: 77.2300,
      bio: "Foodie, traveler, and golden retriever mom 🐶 Looking for good vibes & deep chats.",
      profession: "Marketing Lead",
      education: "Delhi University",
      height: 170,
      intention: RelationshipIntention.LONG_TERM,
      photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800",
      firstMessage: "Hey handsome! Looking forward to matching with someone who loves dogs too 🐾",
      secondMessage: "My golden retriever Leo says hello! Do you have any pets?",
    },
    {
      phone: "+919999000005",
      email: "kavya.nair@tmd.internal",
      name: "Kavya Nair",
      age: 23,
      dob: new Date("2003-11-08"),
      gender: "Female",
      interestedIn: "Male",
      city: "Delhi",
      latitude: 28.6300,
      longitude: 77.2200,
      bio: "Curator of rooftop live gigs & culinary pop-ups. TMD Pro community member 🎵",
      profession: "Event Producer",
      education: "Mass Communication",
      height: 166,
      intention: RelationshipIntention.LONG_TERM,
      photoUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800",
      firstMessage: "Hey! What's your favorite rooftop spot in Delhi? 🌆",
      secondMessage: "I'm hosting an acoustic live gig next Friday on the TMD map, you should totally come!",
    },
  ];

  for (const girl of girlsData) {
    // 3.1 Upsert user
    const girlUser = await prisma.user.upsert({
      where: { phone: girl.phone },
      update: {
        isVerified: true,
        status: "ACTIVE",
      },
      create: {
        phone: girl.phone,
        email: girl.email,
        isVerified: true,
        status: "ACTIVE",
      },
    });

    // 3.2 Upsert profile
    const girlProfile = await prisma.profile.upsert({
      where: { userId: girlUser.id },
      update: {
        name: girl.name,
        dob: girl.dob,
        age: girl.age,
        gender: girl.gender,
        interestedIn: girl.interestedIn,
        city: girl.city,
        latitude: girl.latitude,
        longitude: girl.longitude,
        bio: girl.bio,
        profession: girl.profession,
        education: girl.education,
        height: girl.height,
        relationshipIntention: girl.intention,
      },
      create: {
        userId: girlUser.id,
        name: girl.name,
        dob: girl.dob,
        age: girl.age,
        gender: girl.gender,
        interestedIn: girl.interestedIn,
        city: girl.city,
        latitude: girl.latitude,
        longitude: girl.longitude,
        bio: girl.bio,
        profession: girl.profession,
        education: girl.education,
        height: girl.height,
        relationshipIntention: girl.intention,
      },
    });

    // 3.3 Ensure photo exists
    const existingPhoto = await prisma.profilePhoto.findFirst({
      where: { profileId: girlProfile.id },
    });

    if (!existingPhoto) {
      await prisma.profilePhoto.create({
        data: {
          profileId: girlProfile.id,
          storageKey: `seed_${girl.name.toLowerCase().replace(/\s+/g, "_")}`,
          url: girl.photoUrl,
          order: 1,
          isPrimary: true,
          status: PhotoStatus.APPROVED,
        },
      });
    }

    // 3.4 Create Mutual Likes between target user and this girl
    for (const tu of targetUsers) {
      await prisma.like.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: girlUser.id,
            toUserId: tu.id,
          },
        },
        update: {},
        create: {
          fromUserId: girlUser.id,
          toUserId: tu.id,
        },
      });

      await prisma.like.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: tu.id,
            toUserId: girlUser.id,
          },
        },
        update: {},
        create: {
          fromUserId: tu.id,
          toUserId: girlUser.id,
        },
      });

      // 3.5 Create or get Match
      // Deterministic user order (user1Id < user2Id)
      const [u1, u2] = tu.id < girlUser.id ? [tu.id, girlUser.id] : [girlUser.id, tu.id];

      const match = await prisma.match.upsert({
        where: {
          user1Id_user2Id: {
            user1Id: u1,
            user2Id: u2,
          },
        },
        update: {
          status: "ACTIVE",
        },
        create: {
          user1Id: u1,
          user2Id: u2,
          status: "ACTIVE",
        },
      });

      // 3.6 Create or get Conversation
      let conversation = await prisma.conversation.findUnique({
        where: { matchId: match.id },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            matchId: match.id,
            lastMessageAt: new Date(),
          },
        });
      }

      // 3.7 Add messages if conversation is empty
      const msgCount = await prisma.message.count({
        where: { conversationId: conversation.id },
      });

      if (msgCount === 0) {
        // Message 1 from Girl
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: girlUser.id,
            content: girl.firstMessage,
            status: "READ",
            createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          },
        });

        // Message 2 from Girl (recent unread message)
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: girlUser.id,
            content: girl.secondMessage,
            status: "DELIVERED",
            createdAt: new Date(Date.now() - 300000), // 5 mins ago
          },
        });

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: new Date(Date.now() - 300000) },
        });
      }

      console.log(`  ✓ Matched & created active chat with ${girl.name} for ${tu.phone || tu.id}`);
    }
  }

  // 4. Seed sample events on the Map for testing
  console.log("Checking events on the Map...");
  const eventCount = await prisma.event.count();
  if (eventCount === 0 && primaryTargetUser) {
    const kavyaUser = await prisma.user.findUnique({
      where: { phone: "+919999000005" },
    });

    const organizerId = kavyaUser ? kavyaUser.id : primaryTargetUser.id;

    const sampleEvents = [
      {
        title: "Sunset Rooftop Mixer & Cocktails",
        category: "Rooftop Mixer",
        description: "Join 30+ singles for sunset drinks, chill deep house beats, and great conversations at Hauz Khas Village.",
        coverPhotoUrl: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800",
        venue: "Mia Bella Rooftop",
        address: "Hauz Khas Village, New Delhi",
        latitude: 28.5494,
        longitude: 77.2001,
        isResidential: false,
        minAge: 21,
        capacity: 40,
        seatsLeft: 40,
        feeInPaise: 49900,
        attendanceMode: "OPEN_JOIN",
        startDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
        endDateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000),
      },
      {
        title: "Singles Board Game & Specialty Coffee Evening",
        category: "Coffee & Games",
        description: "Casual evening with Catan, Secret Hitler, and specialty pour-overs. Perfect for icebreakers!",
        coverPhotoUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800",
        venue: "Blue Tokai Coffee Roasters",
        address: "Connaught Place, New Delhi",
        latitude: 28.6304,
        longitude: 77.2177,
        isResidential: false,
        minAge: 21,
        capacity: 25,
        seatsLeft: 25,
        feeInPaise: 29900,
        attendanceMode: "OPEN_JOIN",
        startDateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // In 4 days
        endDateTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000),
      },
      {
        title: "Cozy Acoustic Live Jam & BYOB House Party",
        category: "House Party",
        description: "Intimate residential acoustic session with singer-songwriters. BYOB & homemade tapas. Verified TMD members only.",
        coverPhotoUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800",
        venue: "Private Villa Rooftop",
        address: "Greater Kailash 1, New Delhi",
        latitude: 28.5535,
        longitude: 77.2389,
        isResidential: true,
        minAge: 22,
        capacity: 20,
        seatsLeft: 20,
        feeInPaise: 0,
        attendanceMode: "REQUEST_APPROVAL",
        startDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        endDateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 5 * 3600 * 1000),
      },
    ];

    for (const ev of sampleEvents) {
      await prisma.event.create({
        data: {
          ...ev,
          organizerId,
        },
      });
    }
    console.log("  ✓ Seeded 3 interactive Delhi Events on Map");
  }

  console.log("🎉 Successfully configured 5 girls in chat and activated PRO plan!");
}

main()
  .catch((e) => {
    console.error("Error executing script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
