/**
 * Remove generated/fake bands from the database.
 * Fake bands = no spotifyId AND not referenced by any events, pledges, or dream shows.
 *
 * Run with: npx tsx scripts/cleanup-fake-bands.ts
 */

import path from "node:path";
import fs from "node:fs";

// Load .env.local
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

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Cleaning up fake/generated bands...\n");

  // Count total bands
  const totalBands = await prisma.band.count();
  console.log(`Total bands in DB: ${totalBands}`);

  // Count bands with Spotify IDs (real)
  const realBands = await prisma.band.count({ where: { spotifyId: { not: null } } });
  console.log(`Bands with Spotify ID (real): ${realBands}`);

  // Count bands without Spotify IDs (potentially fake)
  const fakeBands = await prisma.band.count({ where: { spotifyId: null } });
  console.log(`Bands without Spotify ID (candidates for deletion): ${fakeBands}`);

  // Find fake bands that ARE referenced (have events, dream shows, or user preferences)
  const referencedFakeBands = await prisma.band.findMany({
    where: {
      spotifyId: null,
      OR: [
        { events: { some: {} } },
        { dreamShows: { some: {} } },
        { userPreferences: { some: {} } },
      ],
    },
    select: { id: true, name: true },
  });

  console.log(`\nFake bands with references (will KEEP): ${referencedFakeBands.length}`);
  if (referencedFakeBands.length > 0) {
    for (const b of referencedFakeBands.slice(0, 10)) {
      console.log(`  - ${b.name}`);
    }
    if (referencedFakeBands.length > 10) {
      console.log(`  ... and ${referencedFakeBands.length - 10} more`);
    }
  }

  const referencedIds = new Set(referencedFakeBands.map((b) => b.id));

  // Delete unreferenced fake bands
  const toDelete = await prisma.band.findMany({
    where: {
      spotifyId: null,
      id: { notIn: Array.from(referencedIds) },
    },
    select: { id: true, name: true },
  });

  console.log(`\nFake bands to DELETE: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("Nothing to delete!");
    return;
  }

  // Show sample
  console.log("Sample of bands being deleted:");
  for (const b of toDelete.slice(0, 15)) {
    console.log(`  - ${b.name}`);
  }
  if (toDelete.length > 15) {
    console.log(`  ... and ${toDelete.length - 15} more`);
  }

  // Also delete UserBandPreferences for these bands first (cascade should handle, but be safe)
  const prefDeleted = await prisma.userBandPreference.deleteMany({
    where: { bandId: { in: toDelete.map((b) => b.id) } },
  });
  console.log(`\nDeleted ${prefDeleted.count} orphaned band preferences`);

  // Delete the fake bands
  const deleted = await prisma.band.deleteMany({
    where: { id: { in: toDelete.map((b) => b.id) } },
  });

  console.log(`✅ Deleted ${deleted.count} fake/generated bands`);

  // Final count
  const remaining = await prisma.band.count();
  console.log(`\nBands remaining: ${remaining}`);
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
