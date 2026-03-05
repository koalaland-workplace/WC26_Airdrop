import { PrismaClient } from "@prisma/client";
import { authenticator } from "otplib";

const prisma = new PrismaClient();

async function main() {
  const ownerSecret = authenticator.generateSecret();
  const adminSecret = authenticator.generateSecret();

  await prisma.boardMember.upsert({
    where: { telegramId: "10000001" },
    update: {},
    create: {
      telegramId: "10000001",
      username: "wc26_owner",
      displayName: "Owner",
      role: "owner",
      requiresTotp: true,
      totpSecret: ownerSecret
    }
  });

  await prisma.boardMember.upsert({
    where: { telegramId: "10000002" },
    update: {},
    create: {
      telegramId: "10000002",
      username: "wc26_admin",
      displayName: "Admin",
      role: "admin",
      requiresTotp: true,
      totpSecret: adminSecret
    }
  });

  await prisma.boardMember.upsert({
    where: { telegramId: "10000003" },
    update: {},
    create: {
      telegramId: "10000003",
      username: "wc26_mod",
      displayName: "Moderator",
      role: "moderator",
      requiresTotp: false
    }
  });

  await prisma.appUser.createMany({
    data: [
      { telegramId: "20000001", username: "samba_fc", nationCode: "BR", kick: 482100, status: "vip" },
      { telegramId: "20000002", username: "amir_88", nationCode: "AR", kick: 374500, status: "active" },
      { telegramId: "20000003", username: "footballking", nationCode: "FR", kick: 291000, status: "active" }
    ],
    skipDuplicates: true
  });

  await prisma.featureConfig.upsert({
    where: { key: "spin" },
    update: {},
    create: {
      key: "spin",
      value: {
        dailyCap: 5,
        rewards: [
          { id: "k50", chance: 30, value: 50 },
          { id: "k100", chance: 25, value: 100 },
          { id: "k200", chance: 10, value: 200 },
          { id: "q2x", chance: 10, value: 2 }
        ]
      }
    }
  });

  await prisma.featureConfig.upsert({
    where: { key: "penalty" },
    update: {},
    create: {
      key: "penalty",
      value: {
        soloFreePerDay: 3,
        soloExtraCost: 500,
        soloWin: 2000,
        pvpWin: 2000,
        pvpLose: -2500,
        pvpBurn: 500
      }
    }
  });

  console.log("Seed completed");
  console.log("Owner TOTP secret:", ownerSecret);
  console.log("Admin TOTP secret:", adminSecret);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
