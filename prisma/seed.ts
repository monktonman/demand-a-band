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

  console.log("\n🎶 Seeding complete! Database is ready.\n");
  console.log("Admin login: admin@demandaband.com / admin123!");
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
