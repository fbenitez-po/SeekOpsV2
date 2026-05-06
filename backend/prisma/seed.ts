import {PrismaClient} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ─── Income Categories ───────────────────────────────────────────────
  const incomeCategories = [
    { code: "CONSULTORIA", name: "Consultoría" },
    { code: "DESARROLLO", name: "Desarrollo" },
    { code: "MANTENIMIENTO", name: "Mantenimiento" },
    { code: "SOPORTE", name: "Soporte" },
  ];
  for (const item of incomeCategories) {
    await prisma.incomeCategory.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Client Categories ────────────────────────────────────────────────
  const clientCategories = [
    { code: "ESTRATEGIA", name: "Estrategia" },
    { code: "GESTORES_GESTION", name: "Gestores - Gestión y planeamiento" },
    { code: "UX_RESEARCH", name: "User Experience - Research" },
    { code: "UI", name: "User Interface" },
    { code: "DEV_FRONTEND", name: "Development - Front End" },
    { code: "SEO", name: "SEO" },
    { code: "DEV_BACKEND", name: "Development - Back - End" },
    { code: "DEV_QA", name: "Development - QA" },
    { code: "UX_PROTOTYPE", name: "User Experience - Prototype" },
    { code: "DISENIO_SOCIAL_MEDIA", name: "Diseño Social Media" },
    { code: "APOYO", name: "Apoyo" },
    { code: "UI_PROTOTYPE", name: "User Interface - Prototype" },
    { code: "UX_TESTING", name: "User Experience - Testing" },
    { code: "LIDERES_GESTION", name: "Líderes - Gestión" },
    { code: "PRODUCT_MANAGEMENT", name: "Product Management" },
    { code: "CAPACITACIONES", name: "Capacitaciones" },
    { code: "PROPUESTAS_COMERCIALES", name: "Propuestas Comerciales" },
    { code: "RECLUTAMIENTO", name: "Reclutamiento" },
  ];
  for (const item of clientCategories) {
    await prisma.clientCategory.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Service Types ────────────────────────────────────────────────────
  const serviceTypes = [
    { code: "PROYECTO", name: "Proyecto" },
    { code: "SERVICIO_RECURRENTE", name: "Servicio recurrente" },
  ];
  for (const item of serviceTypes) {
    await prisma.serviceType.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Client Segmentations ─────────────────────────────────────────────
  const clientSegmentations = [
    { code: "CUENTA_CLAVE", name: "Cuenta Clave" },
    { code: "CUENTA_INTERNACIONAL", name: "Cuenta Internacional" },
    { code: "CUENTA_DESARROLLO", name: "Cuenta Desarrollo" },
    { code: "CUENTA_CASUAL", name: "Cuenta Casual" },
    { code: "CUENTA_INACTIVA", name: "Cuenta Inactiva" },
    { code: "CUENTA_EXCLUIDA", name: "Cuenta Excluida" },
    { code: "NUEVOS_CLIENTES", name: "Nuevos Clientes" },
  ];
  for (const item of clientSegmentations) {
    await prisma.clientSegmentation.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Client Sectors ───────────────────────────────────────────────────
  const clientSectors = [
    { code: "CONSULTORIA", name: "Consultoría" },
    { code: "BANCA_FINANCIERO", name: "Banca y Servicios Financieros" },
    { code: "TECNOLOGIA", name: "Tecnología" },
    { code: "TRANSPORTE", name: "Transporte" },
    { code: "ALIMENTACION", name: "Alimentación" },
    { code: "CUIDADO_PERSONAL", name: "Cuidado Personal" },
    { code: "INST_EDUCATIVAS", name: "Instituciones Educativas" },
    { code: "RETAIL", name: "Retail" },
    { code: "CONSTRUCCION", name: "Construcción" },
    { code: "SALUD_FARMA", name: "Salud y Farma" },
    { code: "VARIOS", name: "Varios" },
    { code: "PESCA", name: "Pesca" },
    { code: "GOBIERNO", name: "Gobierno" },
    { code: "INMOBILIARIO", name: "Inmobiliario" },
    { code: "ACELERADORA", name: "Aceleradora" },
    { code: "MARKETING", name: "Marketing" },
    { code: "PUBLICIDAD", name: "Publicidad" },
    { code: "LOGISTICA_SUMINISTRO", name: "Logistica y Suministro" },
    { code: "SEGUROS", name: "Seguros" },
    { code: "TELECOMUNICACIONES", name: "Telecomunicaciones" },
    { code: "CONSUMO_MASIVO", name: "Consumo Masivo" },
    { code: "HIDROCARBUROS", name: "Hidrocarburos" },
    { code: "SERVICIOS", name: "Servicios" },
    { code: "HOTELERIA_TURISMO", name: "Hoteleria y Turismo" },
    { code: "INDUSTRIAL", name: "Industrial" },
    { code: "ENERGIA", name: "Energía" },
    { code: "CEMENTOS", name: "Cementos" },
    { code: "EDUCACION", name: "Educación" },
    { code: "MINERIA", name: "Minería" },
    { code: "INST_DEPORTIVAS", name: "Instituciones Deportivas" },
    { code: "AUTOMOTRIZ", name: "Automotriz" },
    { code: "ONG", name: "ONG" },
    { code: "BELLEZA", name: "Belleza" },
  ];
  for (const item of clientSectors) {
    await prisma.clientSector.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Teams ────────────────────────────────────────────────────────────
  const teams = [
    { code: "UI", name: "U.Interface" },
    { code: "UX", name: "U.Experience" },
    { code: "BRANDING", name: "Branding" },
    { code: "CLIENTE", name: "Cliente" },
    { code: "DIRECTOR", name: "Director" },
    { code: "SEO", name: "SEO" },
    { code: "OUTSOURCING", name: "Outsourcing" },
    { code: "ADMINISTRATIVO", name: "Administrativo" },
    { code: "SOCIAL_MEDIA", name: "Social Media" },
    { code: "ESTRATEGIA", name: "Estrategia" },
    { code: "PRODUCTO", name: "Producto" },
    { code: "DISENIO_EXPERIENCIA", name: "Diseño de Experiencia" },
    { code: "TECNOLOGIA", name: "Tecnología" },
  ];
  for (const item of teams) {
    await prisma.team.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Areas ────────────────────────────────────────────────────────────
  const areas = [
    { code: "TALENTO_CULTURA", name: "Talento & Cultura" },
    { code: "COMERCIAL", name: "Comercial" },
    { code: "PRODUCTO", name: "Producto" },
    { code: "TECNOLOGIA", name: "Tecnología" },
    { code: "ESTRATEGIA", name: "Estrategia" },
    { code: "ADMINISTRACION", name: "Administración" },
    { code: "DISENIO_EXPERIENCIA", name: "Diseño de Experiencia" },
    { code: "OUTSOURCING", name: "Outsourcing" },
  ];
  for (const item of areas) {
    await prisma.area.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── User Groups (roles) ──────────────────────────────────────────────
  const userGroups = [
    { code: "ADMIN", name: "Administradores", description: "Acceso total al sistema" },
    { code: "SEEKER", name: "Seekers", description: "Registro de horas trabajadas" },
    { code: "MANAGER", name: "Gestores", description: "Aprobación de horas del equipo" },
  ];
  for (const item of userGroups) {
    await prisma.userGroup.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Project Segmentation ─────────────────────────────────────────────
  const projectSegmentations = [
    { code: "I001", name: "I001 - Redes Sociales" },
    { code: "I002", name: "I002 - Diseño y Desarrollo de Producto" },
    { code: "I002_DIGITAL", name: "I002 - Diseño y Desarrollo Digital de Producto" },
    { code: "I003", name: "I003 - Branding" },
    { code: "I004", name: "I004 - Product & Experience Design" },
    { code: "I005", name: "I005 - SEO" },
    { code: "I006", name: "I006 - Otros" },
    { code: "I007", name: "I007 - Partnerships" },
    { code: "I008", name: "I008 - Staff Augmentation" },
  ];
  for (const item of projectSegmentations) {
    await prisma.projectSegmentation.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Project Categories ───────────────────────────────────────────────
  const projectCategories = [
    { code: "DESIGN_PARTNERSHIP_SQUAD", name: "Design Partnership Squad" },
    { code: "DEV_PARTNERSHIP_SQUAD", name: "Development Partnership Squad" },
    { code: "INVESTIGACION_RETO", name: "Investigacion de reto" },
    { code: "E_COMMERCE", name: "E - Commerce" },
    { code: "GESTION_ESTRATEGIA_MEDIOS", name: "Gestion Estrategia de Medios" },
    { code: "STAFF_AUG_DEV", name: "Staff Augmentation - Development" },
    { code: "PAGINA_WEB_CORPORATIVA", name: "Pagina Web Corporativa" },
    { code: "BOLSA_HORAS_DEV", name: "Bolsa de Horas - Development" },
    { code: "INTERNO_SEEK", name: "Interno - Seek" },
    { code: "BOLSA_HORAS_DISENO", name: "Bolsa de Horas - Diseño y experiencia" },
    { code: "LANDING_PAGE", name: "Landing Page" },
    { code: "PROD_DIG_DISENO_DEV", name: "Producto Digital - Diseño y Desarrollo" },
    { code: "PROD_DIG_E2E", name: "Producto Digital - End to End" },
    { code: "PROD_DIG_INV_DISENO", name: "Producto Digital - Investigación y Diseño" },
    { code: "MINISITE", name: "Minisite" },
    { code: "PROD_DIG_DISENO_PROD", name: "Producto Digital - Diseño de Producto" },
    { code: "ESTRATEGIA_SEO", name: "Estrategia SEO" },
    { code: "DISENO_SERVICIO", name: "Diseño de Servicio" },
    { code: "PROGRAMA_FIDELIZACION", name: "Programa Fidelizacion" },
    { code: "SERVICIOS_DESARROLLO", name: "Servicios de desarrollo" },
    { code: "BRANDING_SERVICIOS_DISENO", name: "Branding servicios diseño" },
    { code: "ESTRATEGIA_DIG_SOCIAL_MEDIA", name: "Estrategia Digital - Social Media" },
    { code: "BRANDING", name: "Branding" },
    { code: "ESTRATEGIA_DIG_TOOLKIT", name: "Estrategia Digital - Tool Kit" },
    { code: "EVAL_HEURISTICA_UX", name: "Evaluacion Heuristica y Auditoría UX" },
    { code: "BRANDING_BRAND_BOOK", name: "Branding - Brand Book" },
    { code: "BRANDING_OTROS", name: "Branding - Otros Servicios" },
    { code: "ESTRATEGIA_DIG_OTROS", name: "Estrategia Digital - Otros" },
    { code: "STAFF_AUG_DESIGN", name: "Staff Augmentation - Design" },
    { code: "DISENO_ESTRATEGICO", name: "Diseño estratégico" },
    { code: "RECLUTAMIENTO", name: "Reclutamiento" },
    { code: "CAPACITACION", name: "Capacitación" },
    { code: "COMERCIAL", name: "Comercial" },
    { code: "AREA", name: "Área" },
  ];
  for (const item of projectCategories) {
    await prisma.projectCategory.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Productivity Layers ──────────────────────────────────────────────
  const productivityLayers = [
    { code: "OPERATIONAL_BACKBONE", name: "Operational Backbone" },
    { code: "CULTURE_BUILDERS", name: "Culture Builders" },
    { code: "GROWTH_LEAPS", name: "Growth Leaps" },
  ];
  for (const item of productivityLayers) {
    await prisma.productivityLayer.upsert({
      where: { code: item.code },
      update: {},
      create: item,
    });
  }

  // ─── Admin User ───────────────────────────────────────────────────────
  const firstTeam = await prisma.team.findFirst();
  const firstArea = await prisma.area.findFirst();
  const adminGroup = await prisma.userGroup.findUnique({ where: { code: "ADMIN" } });

  if (!firstTeam || !firstArea || !adminGroup) {
    throw new Error("Required seed data (team/area/group) not found");
  }

  const passwordHash = await bcrypt.hash("password", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@seekglobal.co" },
    update: {},
    create: {
      email: "admin@seekglobal.co",
      passwordHash,
      firstName: "Admin",
      lastName: "Seekops",
      documentNumber: "00000001",
      jobTitle: "Administrador del Sistema",
      teamId: firstTeam.id,
      hireDate: new Date("2024-01-01"),
      isActive: true,
      isStaff: true,
      isSuperUser: true,
    },
  });

  await prisma.userArea.upsert({
    where: { userId_areaId: { userId: adminUser.id, areaId: firstArea.id } },
    update: {},
    create: { userId: adminUser.id, areaId: firstArea.id },
  });

  await prisma.userGroupMember.upsert({
    where: { userId_groupId: { userId: adminUser.id, groupId: adminGroup.id } },
    update: {},
    create: { userId: adminUser.id, groupId: adminGroup.id },
  });

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
