#!/usr/bin/env node

import vm from "node:vm";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const DEFAULT_SOURCE_URL = "https://koalaland-workplace.github.io/WC26_Airdrop/";
const DEFAULT_YEAR = 2026;

const MONTH_INDEX = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11
};

function parseArgs(argv) {
  const args = {
    url: process.env.WC26_SOURCE_URL || DEFAULT_SOURCE_URL,
    dryRun: false,
    replace: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (token === "--replace") {
      args.replace = true;
      continue;
    }
    if (token === "--url" && argv[i + 1]) {
      args.url = argv[i + 1];
      i += 1;
      continue;
    }
    if (token.startsWith("--url=")) {
      args.url = token.slice("--url=".length);
    }
  }
  return args;
}

function extractArrayLiteral(html, varName) {
  const patterns = [
    new RegExp(`const\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\n\\]);`),
    new RegExp(`var\\s+${varName}\\s*=\\s*(\\[[\\s\\S]*?\\n\\]);`)
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  throw new Error(`Cannot find ${varName} array in source HTML`);
}

function evaluateArrayLiteral(name, code) {
  const context = vm.createContext({});
  const wrapped = `(${code})`;
  const value = vm.runInContext(wrapped, context, {
    timeout: 1000,
    displayErrors: true
  });
  if (!Array.isArray(value)) {
    throw new Error(`${name} is not an array`);
  }
  return value;
}

function cleanTeamLabel(value) {
  const input = String(value || "").trim();
  if (!input) return "TBD";
  return input
    .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\W_]+/u, "")
    .trim();
}

function splitVenue(venueRaw) {
  const venue = String(venueRaw || "").trim() || "TBD";
  if (venue.includes(",")) {
    const [stadium, ...rest] = venue.split(",");
    return {
      stadium: stadium.trim() || "TBD",
      city: rest.join(",").trim() || null
    };
  }
  const bracket = venue.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (bracket) {
    return {
      stadium: bracket[1].trim() || venue,
      city: bracket[2].trim() || null
    };
  }
  return { stadium: venue, city: null };
}

function parseKickoff(dateRaw, timeRaw, defaultYear = DEFAULT_YEAR) {
  const dateValue = String(dateRaw || "").trim().replace(/\s+/g, " ");
  const timeValue = String(timeRaw || "00:00").trim();
  const parts = dateValue.split(" ").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Invalid date: ${dateValue}`);
  }

  const month = MONTH_INDEX[parts[0].slice(0, 3).toLowerCase()];
  if (month === undefined) {
    throw new Error(`Invalid month in date: ${dateValue}`);
  }

  const day = Number(parts[1].replace(/[^\d]/g, ""));
  const year = Number(parts[2] ? parts[2].replace(/[^\d]/g, "") : defaultYear);
  const [hourRaw, minuteRaw] = timeValue.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isInteger(day) || !Number.isInteger(year) || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Invalid datetime: ${dateValue} ${timeValue}`);
  }

  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
}

function normalizeGroupCode(groupName, fallback) {
  const input = String(groupName || "").trim();
  const groupMatch = input.match(/GROUP\s+([A-Z0-9]+)/i);
  if (groupMatch?.[1]) return groupMatch[1].toUpperCase();
  const compact = input.replace(/[^\w]/g, "").toUpperCase();
  return compact || fallback;
}

function buildFixtures(groups, knockout) {
  const fixtures = [];
  for (const group of groups) {
    const groupCode = normalizeGroupCode(group?.name, "A");
    for (const match of group?.matches ?? []) {
      const { stadium, city } = splitVenue(match?.venue);
      fixtures.push({
        groupCode,
        homeNation: cleanTeamLabel(match?.home),
        awayNation: cleanTeamLabel(match?.away),
        stadium,
        city,
        kickoffAt: parseKickoff(match?.date, match?.time),
        status: "scheduled",
        homeScore: null,
        awayScore: null,
        highlight: `${group?.name ?? `GROUP ${groupCode}`}`
      });
    }
  }

  for (const round of knockout) {
    const groupCode = String(round?.id || "KO").toUpperCase();
    for (const match of round?.matches ?? []) {
      const { stadium, city } = splitVenue(match?.venue);
      fixtures.push({
        groupCode,
        homeNation: cleanTeamLabel(match?.home),
        awayNation: cleanTeamLabel(match?.away),
        stadium,
        city,
        kickoffAt: parseKickoff(match?.date, match?.time),
        status: "scheduled",
        homeScore: null,
        awayScore: null,
        highlight: `${round?.label ?? groupCode}${match?.slot ? ` · ${match.slot}` : ""}`
      });
    }
  }

  const deduped = new Map();
  for (const row of fixtures) {
    const key = [
      row.groupCode,
      row.homeNation.toLowerCase(),
      row.awayNation.toLowerCase(),
      row.kickoffAt.toISOString()
    ].join("|");
    deduped.set(key, row);
  }
  return [...deduped.values()];
}

function sameFixture(a, b) {
  return (
    a.groupCode === b.groupCode &&
    a.homeNation === b.homeNation &&
    a.awayNation === b.awayNation &&
    a.stadium === b.stadium &&
    (a.city || null) === (b.city || null) &&
    new Date(a.kickoffAt).toISOString() === new Date(b.kickoffAt).toISOString() &&
    a.status === b.status &&
    (a.homeScore ?? null) === (b.homeScore ?? null) &&
    (a.awayScore ?? null) === (b.awayScore ?? null) &&
    (a.highlight || null) === (b.highlight || null)
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const response = await fetch(args.url);
  if (!response.ok) {
    throw new Error(`Cannot fetch ${args.url}: HTTP ${response.status}`);
  }
  const html = await response.text();

  const groupsLiteral = extractArrayLiteral(html, "WC26_GROUPS");
  const knockoutLiteral = extractArrayLiteral(html, "WC26_KNOCKOUT");
  const groups = evaluateArrayLiteral("WC26_GROUPS", groupsLiteral);
  const knockout = evaluateArrayLiteral("WC26_KNOCKOUT", knockoutLiteral);

  const fixtures = buildFixtures(groups, knockout);
  const groupStageTotal = groups.reduce((sum, item) => sum + ((item?.matches || []).length || 0), 0);
  const knockoutTotal = knockout.reduce((sum, item) => sum + ((item?.matches || []).length || 0), 0);
  const groupCodes = [...new Set(fixtures.map((item) => item.groupCode))].sort((a, b) => a.localeCompare(b));

  console.log(`[sync-wc26] Source: ${args.url}`);
  console.log(`[sync-wc26] Parsed groups: ${groups.length}, group fixtures: ${groupStageTotal}`);
  console.log(`[sync-wc26] Parsed knockout rounds: ${knockout.length}, knockout fixtures: ${knockoutTotal}`);
  console.log(`[sync-wc26] Total fixtures (deduped): ${fixtures.length}`);
  console.log(`[sync-wc26] Group codes: ${groupCodes.join(", ")}`);

  if (args.dryRun) {
    console.log("[sync-wc26] Dry-run mode: no database writes.");
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment");
  }

  const prisma = new PrismaClient();
  try {
    let created = 0;
    let updated = 0;

    if (args.replace) {
      const deleted = await prisma.matchFixture.deleteMany({
        where: { groupCode: { in: groupCodes } }
      });
      console.log(`[sync-wc26] Replace mode: deleted ${deleted.count} existing fixtures for imported group codes.`);
    }

    const existingRows = await prisma.matchFixture.findMany({
      where: { groupCode: { in: groupCodes } }
    });
    const existingMap = new Map();
    for (const row of existingRows) {
      const key = [
        row.groupCode,
        row.homeNation.toLowerCase(),
        row.awayNation.toLowerCase(),
        row.kickoffAt.toISOString()
      ].join("|");
      if (!existingMap.has(key)) {
        existingMap.set(key, row);
      }
    }

    for (const fixture of fixtures) {
      const key = [
        fixture.groupCode,
        fixture.homeNation.toLowerCase(),
        fixture.awayNation.toLowerCase(),
        fixture.kickoffAt.toISOString()
      ].join("|");
      const existing = existingMap.get(key);
      if (!existing) {
        await prisma.matchFixture.create({ data: fixture });
        created += 1;
        continue;
      }
      if (!sameFixture(existing, fixture)) {
        await prisma.matchFixture.update({
          where: { id: existing.id },
          data: fixture
        });
        updated += 1;
      }
    }

    const totalInDb = await prisma.matchFixture.count({
      where: { groupCode: { in: groupCodes } }
    });

    console.log(`[sync-wc26] Done. created=${created}, updated=${updated}, totalInImportedGroups=${totalInDb}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[sync-wc26] Failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
