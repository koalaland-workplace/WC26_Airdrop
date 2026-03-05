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

  const users = await prisma.appUser.findMany({
    where: { username: { in: ["samba_fc", "amir_88", "footballking"] } }
  });
  const userByName = new Map(users.map((u) => [u.username ?? "", u]));

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

  await prisma.featureConfig.upsert({
    where: { key: "referrals" },
    update: {},
    create: {
      key: "referrals",
      value: {
        f1Register: 200,
        f1Active7d: 500,
        f2Register: 50,
        f2Active7d: 100,
        maxF1PerSeason: 50
      }
    }
  });

  const referralCount = await prisma.referralEvent.count();
  if (referralCount === 0) {
    const footballking = userByName.get("footballking");
    const amir = userByName.get("amir_88");
    const samba = userByName.get("samba_fc");
    if (footballking && amir && samba) {
      await prisma.referralEvent.createMany({
        data: [
          {
            inviterUserId: footballking.id,
            invitedUserId: amir.id,
            level: 1,
            status: "active_7d",
            season: "S1",
            kickAward: 700,
            riskScore: 5
          },
          {
            inviterUserId: footballking.id,
            invitedUserId: samba.id,
            level: 2,
            status: "registered",
            season: "S1",
            kickAward: 50,
            riskScore: 8
          },
          {
            inviterUserId: amir.id,
            invitedTelegramId: "20000088",
            level: 1,
            status: "flagged",
            season: "S1",
            kickAward: 200,
            riskScore: 92
          }
        ]
      });
    }
  }

  const matchCount = await prisma.matchFixture.count();
  if (matchCount === 0) {
    await prisma.matchFixture.createMany({
      data: [
        {
          groupCode: "A",
          homeNation: "Brazil",
          awayNation: "Argentina",
          stadium: "Lusail",
          city: "Lusail",
          kickoffAt: new Date("2026-06-15T20:00:00Z"),
          status: "scheduled"
        },
        {
          groupCode: "B",
          homeNation: "France",
          awayNation: "Germany",
          stadium: "MetLife",
          city: "New York",
          kickoffAt: new Date("2026-06-16T20:00:00Z"),
          status: "scheduled"
        },
        {
          groupCode: "C",
          homeNation: "Spain",
          awayNation: "Portugal",
          stadium: "Azteca",
          city: "Mexico City",
          kickoffAt: new Date("2026-06-17T20:00:00Z"),
          status: "scheduled"
        }
      ]
    });
  }

  await prisma.mission.upsert({
    where: { code: "daily_quiz_champion" },
    update: {},
    create: {
      code: "daily_quiz_champion",
      name: "Daily Quiz Champion",
      phase: "Viral Activation",
      category: "daily",
      rewardKick: 500,
      isActive: true
    }
  });

  await prisma.mission.upsert({
    where: { code: "spin_5x" },
    update: {},
    create: {
      code: "spin_5x",
      name: "Spin 5x in One Day",
      phase: "Viral Activation",
      category: "daily",
      rewardKick: 200,
      isActive: true
    }
  });

  await prisma.mission.upsert({
    where: { code: "invite_3_friends" },
    update: {},
    create: {
      code: "invite_3_friends",
      name: "Invite 3 Friends",
      phase: "Viral Activation",
      category: "growth",
      rewardKick: 1500,
      isActive: true
    }
  });

  const progressCount = await prisma.missionProgress.count();
  if (progressCount === 0 && users.length > 0) {
    const missions = await prisma.mission.findMany();
    const missionByCode = new Map(missions.map((m) => [m.code, m]));
    const footballking = userByName.get("footballking");
    const amir = userByName.get("amir_88");
    if (footballking && amir) {
      const quizMission = missionByCode.get("daily_quiz_champion");
      const spinMission = missionByCode.get("spin_5x");
      if (quizMission && spinMission) {
        await prisma.missionProgress.createMany({
          data: [
            {
              missionId: quizMission.id,
              userId: footballking.id,
              status: "completed",
              progress: 100,
              awardedKick: 500
            },
            {
              missionId: spinMission.id,
              userId: amir.id,
              status: "completed",
              progress: 100,
              awardedKick: 200
            }
          ]
        });
      }
    }
  }

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
