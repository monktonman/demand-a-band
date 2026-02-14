import { PrismaClient, VenueOwnership } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import path from "node:path";
import fs from "node:fs";

// Load .env.local for seed script
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🎸 Seeding Demand A Band database...\n");

  // ============================================
  // ADMIN USER
  // ============================================
  const adminPassword = await bcrypt.hash("admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demandaband.com" },
    update: {},
    create: {
      email: "admin@demandaband.com",
      name: "DAB Admin",
      hashedPassword: adminPassword,
      role: "ADMIN",
      onboarded: true,
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin user created: ${admin.email}`);

  // ============================================
  // BALTIMORE DMA VENUES
  // ============================================
  const venues = [
    {
      name: "Ram's Head Live",
      slug: "rams-head-live",
      address: "20 Market Pl",
      city: "Baltimore",
      state: "MD",
      zipCode: "21202",
      latitude: 39.2856,
      longitude: -76.6062,
      capacity: 2000,
      venueType: "Concert Hall",
      genres: ["Rock", "Pop", "Hip-Hop", "EDM", "Country"],
      ownership: VenueOwnership.CHAIN,
      websiteUrl: "https://www.ramsheadlive.com",
      notes: "Largest club-format venue in Baltimore. Part of Rams Head Group / AEG Presents. National touring acts.",
    },
    {
      name: "Baltimore Soundstage",
      slug: "baltimore-soundstage",
      address: "124 Market Pl",
      city: "Baltimore",
      state: "MD",
      zipCode: "21202",
      latitude: 39.2860,
      longitude: -76.6058,
      capacity: 1200,
      venueType: "Concert Hall",
      genres: ["Rock", "Metal", "Hip-Hop", "EDM", "Indie Rock"],
      ownership: VenueOwnership.INDEPENDENT,
      websiteUrl: "https://www.baltimoresoundstage.com",
      notes: "Key mid-size independent room. Full production. Competes with Ram's Head Live for routing.",
    },
    {
      name: "Maryland Hall",
      slug: "maryland-hall",
      address: "801 Chase St",
      city: "Annapolis",
      state: "MD",
      zipCode: "21401",
      latitude: 38.9784,
      longitude: -76.4922,
      capacity: 1000,
      venueType: "Arts Center",
      genres: ["Folk", "Jazz", "Classical", "Singer-Songwriter"],
      ownership: VenueOwnership.NONPROFIT,
      websiteUrl: "https://www.marylandhall.org",
      notes: "Nonprofit performing arts center. Theater-style seating. Annapolis market, affluent suburban demographic.",
    },
    {
      name: "Ottobar",
      slug: "ottobar",
      address: "2549 N Howard St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21218",
      latitude: 39.3178,
      longitude: -76.6180,
      capacity: 600,
      venueType: "Club",
      genres: ["Indie Rock", "Punk", "Metal", "Alternative", "Electronic"],
      ownership: VenueOwnership.INDEPENDENT,
      websiteUrl: "https://www.theottobar.com",
      notes: "Iconic Baltimore indie venue. Two rooms (upstairs ~200 / downstairs ~600). Nationally recognized on the indie touring circuit.",
    },
    {
      name: "Rams Head On Stage",
      slug: "rams-head-on-stage",
      address: "33 West St",
      city: "Annapolis",
      state: "MD",
      zipCode: "21401",
      latitude: 38.9726,
      longitude: -76.4919,
      capacity: 400,
      venueType: "Listening Room",
      genres: ["Folk", "Blues", "Jazz", "Singer-Songwriter", "Acoustic"],
      ownership: VenueOwnership.CHAIN,
      websiteUrl: "https://www.ramsheadonstage.com",
      notes: "Premier intimate listening room. Seated format. Excellent sound quality. Part of Rams Head Group.",
    },
    {
      name: "The 8x10",
      slug: "the-8x10",
      address: "10 E Cross St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21230",
      latitude: 39.2789,
      longitude: -76.6133,
      capacity: 400,
      venueType: "Club",
      genres: ["Blues", "Rock", "Americana", "Funk", "R&B/Soul"],
      ownership: VenueOwnership.INDEPENDENT,
      websiteUrl: "https://www.the8x10.com",
      notes: "Long-running Baltimore institution (since 1998). Strong blues/roots identity. Named for original stage dimensions.",
    },
    {
      name: "Creative Alliance",
      slug: "creative-alliance",
      address: "3134 Eastern Ave",
      city: "Baltimore",
      state: "MD",
      zipCode: "21224",
      latitude: 39.2886,
      longitude: -76.5763,
      capacity: 400,
      venueType: "Arts Center",
      genres: ["World Music", "Folk", "Experimental", "Indie Rock", "Jazz"],
      ownership: VenueOwnership.NONPROFIT,
      websiteUrl: "https://www.creativealliance.org",
      notes: "Nonprofit arts center in historic Patterson Theater. Diverse programming. Highlandtown neighborhood.",
    },
    {
      name: "Metro Gallery",
      slug: "metro-gallery",
      address: "1700 N Charles St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21201",
      latitude: 39.3100,
      longitude: -76.6162,
      capacity: 200,
      venueType: "Bar with Stage",
      genres: ["Indie Rock", "Experimental", "Punk", "Electronic"],
      ownership: VenueOwnership.INDEPENDENT,
      notes: "Anchor small venue in Station North Arts District. Books adventurous touring acts. Art gallery component.",
    },
    {
      name: "The Crown",
      slug: "the-crown",
      address: "1910 N Charles St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21218",
      latitude: 39.3118,
      longitude: -76.6155,
      capacity: 200,
      venueType: "Bar with Stage",
      genres: ["Punk", "Metal", "Hardcore", "Noise"],
      ownership: VenueOwnership.INDEPENDENT,
      notes: "DIY-oriented. Crucial stop on punk/hardcore/metal underground touring circuit. Station North.",
    },
    {
      name: "Motor House",
      slug: "motor-house",
      address: "120 W North Ave",
      city: "Baltimore",
      state: "MD",
      zipCode: "21201",
      latitude: 39.3108,
      longitude: -76.6200,
      capacity: 200,
      venueType: "Bar with Stage",
      genres: ["Indie Rock", "Experimental", "Electronic"],
      ownership: VenueOwnership.INDEPENDENT,
      notes: "Multi-use arts space. Part of Station North creative ecosystem. Growing music programming.",
    },
    {
      name: "The Windup Space",
      slug: "the-windup-space",
      address: "12 W North Ave",
      city: "Baltimore",
      state: "MD",
      zipCode: "21201",
      latitude: 39.3106,
      longitude: -76.6173,
      capacity: 150,
      venueType: "Bar with Stage",
      genres: ["Indie Rock", "Electronic", "Experimental"],
      ownership: VenueOwnership.INDEPENDENT,
      notes: "Eclectic programming beyond just music (comedy, drag). Important community venue. Station North.",
    },
    {
      name: "Keystone Korner Baltimore",
      slug: "keystone-korner-baltimore",
      address: "1350 Lancaster St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21231",
      latitude: 39.2828,
      longitude: -76.5939,
      capacity: 150,
      venueType: "Listening Room",
      genres: ["Jazz"],
      ownership: VenueOwnership.INDEPENDENT,
      websiteUrl: "https://www.keystonekornerbaltimore.com",
      notes: "Satellite of legendary SF jazz club. Dedicated jazz room. Dinner-and-show model. Harbor East.",
    },
    {
      name: "Sidebar Tavern",
      slug: "sidebar-tavern",
      address: "218 E Lexington St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21202",
      latitude: 39.2912,
      longitude: -76.6095,
      capacity: 300,
      venueType: "Club",
      genres: ["Indie Rock", "Electronic", "Hip-Hop"],
      ownership: VenueOwnership.INDEPENDENT,
      notes: "Multi-level venue. Mix of DJ nights and live bands. Federal Hill nightlife district.",
    },
    {
      name: "Cat's Eye Pub",
      slug: "cats-eye-pub",
      address: "1730 Thames St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21231",
      latitude: 39.2818,
      longitude: -76.5921,
      capacity: 150,
      venueType: "Bar with Stage",
      genres: ["Blues", "Rock", "Americana"],
      ownership: VenueOwnership.INDEPENDENT,
      notes: "Fells Point institution since 1975. Nightly live music. Primarily local/regional blues acts.",
    },
    {
      name: "49 West",
      slug: "49-west",
      address: "49 West St",
      city: "Annapolis",
      state: "MD",
      zipCode: "21401",
      latitude: 38.9728,
      longitude: -76.4923,
      capacity: 150,
      venueType: "Listening Room",
      genres: ["Jazz", "Singer-Songwriter", "Acoustic"],
      ownership: VenueOwnership.INDEPENDENT,
      websiteUrl: "https://www.49westcoffeehouse.com",
      notes: "Intimate coffeehouse/wine bar. Primarily acoustic. Part of Annapolis West Street arts corridor.",
    },
    {
      name: "Joe Squared",
      slug: "joe-squared",
      address: "33 W North Ave",
      city: "Baltimore",
      state: "MD",
      zipCode: "21201",
      latitude: 39.3107,
      longitude: -76.6185,
      capacity: 150,
      venueType: "Restaurant with Stage",
      genres: ["Jazz", "Indie Rock", "Experimental"],
      ownership: VenueOwnership.INDEPENDENT,
      notes: "Restaurant-first venue with committed live music programming. Station North. Jazz-leaning.",
    },
    {
      name: "Union Craft Brewing",
      slug: "union-craft-brewing",
      address: "1700 W 41st St",
      city: "Baltimore",
      state: "MD",
      zipCode: "21211",
      latitude: 39.3358,
      longitude: -76.6421,
      capacity: 300,
      venueType: "Brewery/Taproom",
      genres: ["Indie Rock", "Folk", "Rock"],
      ownership: VenueOwnership.INDEPENDENT,
      websiteUrl: "https://www.unioncraftbrewing.com",
      notes: "Brewery with growing live music events. Woodberry/Hampden neighborhood. Outdoor space available.",
    },
  ];

  for (const venue of venues) {
    await prisma.venue.upsert({
      where: { slug: venue.slug },
      update: venue,
      create: venue,
    });
  }
  console.log(`✅ ${venues.length} Baltimore DMA venues seeded`);

  // ============================================
  // SAMPLE BANDS (popular in Baltimore/AAA radio market)
  // ============================================
  const bands = [
    { name: "Pinegrove", slug: "pinegrove", genres: ["Indie Rock", "Folk", "Alternative"], popularity: 62 },
    { name: "Big Thief", slug: "big-thief", genres: ["Indie Rock", "Folk", "Alternative"], popularity: 68 },
    { name: "Waxahatchee", slug: "waxahatchee", genres: ["Indie Rock", "Singer-Songwriter", "Alternative"], popularity: 60 },
    { name: "Turnstile", slug: "turnstile", genres: ["Punk", "Hardcore", "Rock"], popularity: 65 },
    { name: "Japanese Breakfast", slug: "japanese-breakfast", genres: ["Indie Rock", "Pop", "Alternative"], popularity: 67 },
    { name: "Lucy Dacus", slug: "lucy-dacus", genres: ["Indie Rock", "Singer-Songwriter"], popularity: 63 },
    { name: "Julien Baker", slug: "julien-baker", genres: ["Indie Rock", "Singer-Songwriter", "Alternative"], popularity: 58 },
    { name: "Phoebe Bridgers", slug: "phoebe-bridgers", genres: ["Indie Rock", "Singer-Songwriter", "Folk"], popularity: 75 },
    { name: "Bon Iver", slug: "bon-iver", genres: ["Indie Rock", "Folk", "Electronic"], popularity: 78 },
    { name: "The War on Drugs", slug: "the-war-on-drugs", genres: ["Indie Rock", "Rock", "Alternative"], popularity: 72 },
    { name: "Tyler Childers", slug: "tyler-childers", genres: ["Country", "Folk", "Americana"], popularity: 76 },
    { name: "Hozier", slug: "hozier", genres: ["Folk", "Rock", "Singer-Songwriter"], popularity: 82 },
    { name: "Maggie Rogers", slug: "maggie-rogers", genres: ["Indie Rock", "Pop", "Folk"], popularity: 74 },
    { name: "Mt. Joy", slug: "mt-joy", genres: ["Indie Rock", "Folk", "Rock"], popularity: 66 },
    { name: "Caamp", slug: "caamp", genres: ["Indie Rock", "Folk", "Americana"], popularity: 68 },
    { name: "Khruangbin", slug: "khruangbin", genres: ["Funk", "Rock", "World Music"], popularity: 72 },
    { name: "Kamasi Washington", slug: "kamasi-washington", genres: ["Jazz", "Experimental"], popularity: 55 },
    { name: "Snarky Puppy", slug: "snarky-puppy", genres: ["Jazz", "Funk", "World Music"], popularity: 58 },
    { name: "Tedeschi Trucks Band", slug: "tedeschi-trucks-band", genres: ["Blues", "Rock", "Americana"], popularity: 60 },
    { name: "Jason Isbell", slug: "jason-isbell", genres: ["Americana", "Rock", "Singer-Songwriter"], popularity: 64 },
    { name: "Sturgill Simpson", slug: "sturgill-simpson", genres: ["Country", "Rock", "Americana"], popularity: 65 },
    { name: "Billy Strings", slug: "billy-strings", genres: ["Folk", "Americana", "Rock"], popularity: 70 },
    { name: "Goose", slug: "goose", genres: ["Rock", "Indie Rock", "Experimental"], popularity: 62 },
    { name: "Mdou Moctar", slug: "mdou-moctar", genres: ["Rock", "World Music", "Experimental"], popularity: 52 },
    { name: "Black Midi", slug: "black-midi", genres: ["Experimental", "Rock", "Punk"], popularity: 50 },
    { name: "Fontaines D.C.", slug: "fontaines-dc", genres: ["Punk", "Rock", "Alternative"], popularity: 64 },
    { name: "Boygenius", slug: "boygenius", genres: ["Indie Rock", "Singer-Songwriter", "Alternative"], popularity: 72 },
    { name: "Alvvays", slug: "alvvays", genres: ["Indie Rock", "Pop", "Alternative"], popularity: 63 },
    { name: "Beach House", slug: "beach-house", genres: ["Indie Rock", "Electronic", "Alternative"], popularity: 70 },
    { name: "Animal Collective", slug: "animal-collective", genres: ["Experimental", "Electronic", "Indie Rock"], popularity: 58 },
    { name: "Future Islands", slug: "future-islands", genres: ["Indie Rock", "Electronic", "Pop"], popularity: 60 },
    { name: "Dan Deacon", slug: "dan-deacon", genres: ["Electronic", "Experimental"], popularity: 45 },
    { name: "Lower Dens", slug: "lower-dens", genres: ["Indie Rock", "Electronic", "Alternative"], popularity: 40 },
    { name: "Snail Mail", slug: "snail-mail", genres: ["Indie Rock", "Singer-Songwriter", "Alternative"], popularity: 55 },
    { name: "JPEGMAFIA", slug: "jpegmafia", genres: ["Hip-Hop", "Experimental", "Electronic"], popularity: 62 },
    { name: "The National", slug: "the-national", genres: ["Indie Rock", "Rock", "Alternative"], popularity: 73 },
    { name: "Fleet Foxes", slug: "fleet-foxes", genres: ["Folk", "Indie Rock", "Singer-Songwriter"], popularity: 71 },
    { name: "Iron & Wine", slug: "iron-and-wine", genres: ["Folk", "Singer-Songwriter", "Indie Rock"], popularity: 62 },
    { name: "Wilco", slug: "wilco", genres: ["Rock", "Alternative", "Americana"], popularity: 63 },
    { name: "My Morning Jacket", slug: "my-morning-jacket", genres: ["Rock", "Alternative", "Americana"], popularity: 58 },
    // Dream Show / Premium tier bands
    { name: "Radiohead", slug: "radiohead", genres: ["Rock", "Alternative", "Electronic"], popularity: 85 },
    { name: "Bruce Springsteen", slug: "bruce-springsteen", genres: ["Rock", "Singer-Songwriter"], popularity: 82 },
    { name: "Taylor Swift", slug: "taylor-swift", genres: ["Pop", "Country", "Singer-Songwriter"], popularity: 99 },
    { name: "Kendrick Lamar", slug: "kendrick-lamar", genres: ["Hip-Hop", "R&B/Soul"], popularity: 92 },
    { name: "Billie Eilish", slug: "billie-eilish", genres: ["Pop", "Alternative", "Electronic"], popularity: 93 },
    { name: "Dave Matthews Band", slug: "dave-matthews-band", genres: ["Rock", "Folk", "Jazz"], popularity: 72 },
    { name: "Pearl Jam", slug: "pearl-jam", genres: ["Rock", "Alternative"], popularity: 78 },
    { name: "Foo Fighters", slug: "foo-fighters", genres: ["Rock", "Alternative"], popularity: 82 },
    { name: "Jack White", slug: "jack-white", genres: ["Rock", "Blues", "Alternative"], popularity: 70 },
    { name: "Arcade Fire", slug: "arcade-fire", genres: ["Indie Rock", "Rock", "Alternative"], popularity: 72 },
  ];

  for (const band of bands) {
    await prisma.band.upsert({
      where: { slug: band.slug },
      update: band,
      create: band,
    });
  }
  console.log(`✅ ${bands.length} bands seeded`);

  // ============================================
  // SAMPLE USERS (for realistic demo)
  // ============================================
  const demoPassword = await bcrypt.hash("demo123!", 12);
  const sampleUsers = [
    { email: "sarah@example.com", name: "Sarah Johnson" },
    { email: "mike@example.com", name: "Mike Chen" },
    { email: "emma@example.com", name: "Emma Williams" },
    { email: "james@example.com", name: "James Rodriguez" },
    { email: "olivia@example.com", name: "Olivia Park" },
    { email: "noah@example.com", name: "Noah Thompson" },
    { email: "ava@example.com", name: "Ava Martinez" },
    { email: "liam@example.com", name: "Liam O'Brien" },
    { email: "sophia@example.com", name: "Sophia Kim" },
    { email: "ethan@example.com", name: "Ethan Davis" },
    { email: "mia@example.com", name: "Mia Brown" },
    { email: "lucas@example.com", name: "Lucas Garcia" },
    { email: "charlotte@example.com", name: "Charlotte Lee" },
    { email: "aiden@example.com", name: "Aiden Taylor" },
    { email: "harper@example.com", name: "Harper Wilson" },
  ];

  const createdUsers = [];
  for (const user of sampleUsers) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        name: user.name,
        hashedPassword: demoPassword,
        role: "FAN",
        onboarded: true,
        emailVerified: new Date(),
      },
    });
    createdUsers.push(created);
  }
  console.log(`✅ ${sampleUsers.length} demo users created`);

  // ============================================
  // SAMPLE BAND PREFERENCES (demand signals)
  // ============================================
  const allBands = await prisma.band.findMany();
  const bandsBySlug = new Map(allBands.map((b) => [b.slug, b]));

  // Create realistic preference distributions
  const popularBandSlugs = [
    "phoebe-bridgers", "bon-iver", "hozier", "japanese-breakfast",
    "the-war-on-drugs", "tyler-childers", "big-thief", "beach-house",
    "khruangbin", "boygenius", "maggie-rogers", "billy-strings",
    "the-national", "fleet-foxes", "turnstile", "fontaines-dc",
    "snail-mail", "pinegrove", "waxahatchee", "future-islands",
  ];

  const dreamShowSlugs = [
    "radiohead", "foo-fighters", "taylor-swift", "kendrick-lamar",
    "bruce-springsteen", "pearl-jam", "billie-eilish",
  ];

  let prefCount = 0;
  for (const user of createdUsers) {
    // Each user picks 3-8 random bands
    const shuffled = [...popularBandSlugs].sort(() => Math.random() - 0.5);
    const numBands = 3 + Math.floor(Math.random() * 6);
    const selectedBands = shuffled.slice(0, numBands);

    let priority = 1;
    for (const slug of selectedBands) {
      const band = bandsBySlug.get(slug);
      if (!band) continue;

      const maxPrice = [30, 40, 50, 60, 75, 100][Math.floor(Math.random() * 6)];

      await prisma.userBandPreference.upsert({
        where: {
          userId_bandId: { userId: user.id, bandId: band.id },
        },
        update: {},
        create: {
          userId: user.id,
          bandId: band.id,
          maxTicketPrice: maxPrice,
          priority: priority++,
          isDreamShow: false,
        },
      });
      prefCount++;
    }

    // 60% of users also pick 1-2 dream shows
    if (Math.random() < 0.6) {
      const dreamShuffled = [...dreamShowSlugs].sort(() => Math.random() - 0.5);
      const numDream = 1 + Math.floor(Math.random() * 2);

      for (const slug of dreamShuffled.slice(0, numDream)) {
        const band = bandsBySlug.get(slug);
        if (!band) continue;

        const dreamPrice = [200, 300, 500, 750, 1000][Math.floor(Math.random() * 5)];

        await prisma.userBandPreference.upsert({
          where: {
            userId_bandId: { userId: user.id, bandId: band.id },
          },
          update: {},
          create: {
            userId: user.id,
            bandId: band.id,
            maxTicketPrice: dreamPrice,
            priority: priority++,
            isDreamShow: true,
          },
        });
        prefCount++;
      }
    }

    // City preferences
    await prisma.userCityPreference.upsert({
      where: {
        userId_city_state: { userId: user.id, city: "Baltimore", state: "MD" },
      },
      update: {},
      create: {
        userId: user.id,
        city: "Baltimore",
        state: "MD",
        maxRadius: 25 + Math.floor(Math.random() * 50),
      },
    });
  }
  console.log(`✅ ${prefCount} band preferences created`);

  // ============================================
  // SAMPLE EVENTS (shows users can pledge for)
  // ============================================
  const allVenues = await prisma.venue.findMany();
  const venuesBySlug = new Map(allVenues.map((v) => [v.slug, v]));

  const sampleEvents = [
    {
      bandSlug: "japanese-breakfast",
      venueSlug: "ottobar",
      ticketPrice: 35,
      minPledges: 150,
      daysFromNow: 45,
      deadlineDaysFromNow: 21,
    },
    {
      bandSlug: "khruangbin",
      venueSlug: "rams-head-live",
      ticketPrice: 55,
      minPledges: 400,
      daysFromNow: 60,
      deadlineDaysFromNow: 30,
    },
    {
      bandSlug: "turnstile",
      venueSlug: "baltimore-soundstage",
      ticketPrice: 40,
      minPledges: 300,
      daysFromNow: 50,
      deadlineDaysFromNow: 25,
    },
    {
      bandSlug: "phoebe-bridgers",
      venueSlug: "rams-head-on-stage",
      ticketPrice: 65,
      minPledges: 100,
      daysFromNow: 55,
      deadlineDaysFromNow: 28,
    },
    {
      bandSlug: "billy-strings",
      venueSlug: "the-8x10",
      ticketPrice: 50,
      minPledges: 100,
      daysFromNow: 40,
      deadlineDaysFromNow: 18,
    },
    {
      bandSlug: "big-thief",
      venueSlug: "creative-alliance",
      ticketPrice: 45,
      minPledges: 80,
      daysFromNow: 70,
      deadlineDaysFromNow: 35,
    },
  ];

  const createdEvents = [];
  for (const eventData of sampleEvents) {
    const band = bandsBySlug.get(eventData.bandSlug);
    const venue = venuesBySlug.get(eventData.venueSlug);
    if (!band || !venue) continue;

    const eventDate = new Date();
    eventDate.setDate(eventDate.getDate() + eventData.daysFromNow);
    eventDate.setHours(20, 0, 0, 0);

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + eventData.deadlineDaysFromNow);
    deadlineDate.setHours(23, 59, 59, 0);

    const doorsTime = new Date(eventDate);
    doorsTime.setHours(19, 0, 0, 0);

    const slug = `${band.slug}-at-${venue.slug}-${eventDate.getFullYear()}`;
    const title = `${band.name} at ${venue.name}`;
    const serviceFee = eventData.ticketPrice < 15 ? 3.5 : Math.round(eventData.ticketPrice * 0.12 * 100) / 100;

    const event = await prisma.event.upsert({
      where: { slug },
      update: {},
      create: {
        bandId: band.id,
        venueId: venue.id,
        title,
        slug,
        description: `An intimate evening with ${band.name} at ${venue.name}. ${band.genres.slice(0, 2).join(" / ")} at its finest.`,
        eventDate,
        doorsTime,
        showTime: eventDate,
        ticketPrice: eventData.ticketPrice,
        serviceFee,
        minPledges: eventData.minPledges,
        maxCapacity: venue.capacity,
        pledgeDeadline: deadlineDate,
        status: "PROPOSED",
      },
    });
    createdEvents.push(event);
  }
  console.log(`✅ ${createdEvents.length} sample events created`);

  // ============================================
  // SAMPLE PLEDGES (make events look active)
  // ============================================
  let pledgeCount = 0;
  for (const event of createdEvents) {
    // 30-70% of users pledge for each event
    const pledgeRatio = 0.3 + Math.random() * 0.4;
    const numPledgers = Math.floor(createdUsers.length * pledgeRatio);
    const shuffledUsers = [...createdUsers].sort(() => Math.random() - 0.5);

    for (const user of shuffledUsers.slice(0, numPledgers)) {
      const eventDetails = await prisma.event.findUnique({
        where: { id: event.id },
      });
      if (!eventDetails) continue;

      const ticketPrice = Number(eventDetails.ticketPrice);
      const serviceFee = Number(eventDetails.serviceFee);
      const quantity = Math.random() < 0.3 ? 2 : 1; // 30% get 2 tickets
      const totalAmount = (ticketPrice + serviceFee) * quantity;

      try {
        await prisma.pledge.upsert({
          where: {
            userId_eventId: { userId: user.id, eventId: event.id },
          },
          update: {},
          create: {
            userId: user.id,
            eventId: event.id,
            quantity,
            totalAmount,
            status: "ACTIVE",
          },
        });
        pledgeCount++;
      } catch {
        // Skip if duplicate
      }
    }

    // Update event status if threshold met
    const pledgeTotal = await prisma.pledge.count({
      where: { eventId: event.id },
    });
    if (pledgeTotal >= event.minPledges) {
      await prisma.event.update({
        where: { id: event.id },
        data: { status: "THRESHOLD_MET" },
      });
    }
  }
  console.log(`✅ ${pledgeCount} sample pledges created`);

  console.log("\n🎶 Seeding complete! Database is ready.\n");
  console.log("Admin login: admin@demandaband.com / admin123!");
  console.log("Demo user login: sarah@example.com / demo123!");
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
