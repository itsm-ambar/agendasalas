import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const rooms = [
    {
      name: "Sala GD4",
      slug: "gd4",
      location: null,
      capacity: 8,
      description: null,
      color: "#080F26",
      requiresApproval: false,
    },
    {
      name: "Sala Componentes",
      slug: "componentes",
      location: null,
      capacity: 6,
      description: null,
      color: "#303030",
      requiresApproval: false,
    },
    {
      name: "Sala Projetos",
      slug: "projetos",
      location: null,
      capacity: 10,
      description: null,
      color: "#6B7184",
      requiresApproval: false,
    },
    {
      name: "Sala Board",
      slug: "board",
      location: null,
      capacity: 12,
      description: "Sala disponível somente com aprovação da diretoria.",
      color: "#FB0047",
      requiresApproval: true,
    },
    {
      name: "Sala Simple Wall",
      slug: "simple-wall",
      location: null,
      capacity: 6,
      description: null,
      color: "#9AA0AD",
      requiresApproval: false,
    },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({ where: { slug: r.slug }, update: r, create: r });
    console.log(`Sala pronta: ${r.name}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
