import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.income_categories.createMany({
    data: [
      { code: 'RECLUTAMIENTO', name: 'Reclutamiento', description: '' },
      { code: 'CAPACITACION',  name: 'Capacitación',  description: '' },
      { code: 'COMERCIAL',     name: 'Comercial',     description: '' },
      { code: 'AREA',          name: 'Área',          description: '' },
      { code: 'CULTURA',       name: 'Cultura',       description: '' },
    ],
    skipDuplicates: true,
  });

  await prisma.work_categories.createMany({
    data: [
      { code: 'ESTRATEGIA',             name: 'Estrategia' },
      { code: 'GESTORES_GESTION',       name: 'Gestores - Gestión y planeamiento' },
      { code: 'UX_RESEARCH',            name: 'User Experience - Research' },
      { code: 'UI',                     name: 'User Interface' },
      { code: 'DEV_FRONTEND',           name: 'Development - Front End' },
      { code: 'SEO',                    name: 'SEO' },
      { code: 'DEV_BACKEND',            name: 'Development - Back - End' },
      { code: 'DEV_QA',                 name: 'Development - QA' },
      { code: 'UX_PROTOTYPE',           name: 'User Experience - Prototype' },
      { code: 'DISENIO_SOCIAL_MEDIA',   name: 'Diseño Social Media' },
      { code: 'APOYO',                  name: 'Apoyo' },
      { code: 'UI_PROTOTYPE',           name: 'User Interface - Prototype' },
      { code: 'UX_TESTING',             name: 'User Experience - Testing' },
      { code: 'LIDERES_GESTION',        name: 'Líderes - Gestión' },
      { code: 'PRODUCT_MANAGEMENT',     name: 'Product Management' },
      { code: 'CAPACITACIONES',         name: 'Capacitaciones' },
      { code: 'PROPUESTAS_COMERCIALES', name: 'Propuestas Comerciales' },
      { code: 'RECLUTAMIENTO',          name: 'Reclutamiento' },
    ],
    skipDuplicates: true,
  });

  await prisma.service_types.createMany({
    data: [
      { code: 'PROYECTO',            name: 'Proyecto' },
      { code: 'SERVICIO_RECURRENTE', name: 'Servicio recurrente' },
    ],
    skipDuplicates: true,
  });

  await prisma.client_segmentations.createMany({
    data: [
      { code: 'CUENTA_CLAVE',         name: 'Cuenta Clave' },
      { code: 'CUENTA_INTERNACIONAL', name: 'Cuenta Internacional' },
      { code: 'CUENTA_DESARROLLO',    name: 'Cuenta Desarrollo' },
      { code: 'CUENTA_CASUAL',        name: 'Cuenta Casual' },
      { code: 'CUENTA_INACTIVA',      name: 'Cuenta Inactiva' },
      { code: 'CUENTA_EXCLUIDA',      name: 'Cuenta Excluida' },
      { code: 'NUEVOS_CLIENTES',      name: 'Nuevos Clientes' },
    ],
    skipDuplicates: true,
  });

  await prisma.client_sectors.createMany({
    data: [
      { code: 'CONSULTORIA',          name: 'Consultoría' },
      { code: 'BANCA_FINANCIERO',     name: 'Banca y Servicios Financieros' },
      { code: 'TECNOLOGIA',           name: 'Tecnología' },
      { code: 'TRANSPORTE',           name: 'Transporte' },
      { code: 'ALIMENTACION',         name: 'Alimentación' },
      { code: 'CUIDADO_PERSONAL',     name: 'Cuidado Personal' },
      { code: 'INST_EDUCATIVAS',      name: 'Instituciones Educativas' },
      { code: 'RETAIL',               name: 'Retail' },
      { code: 'CONSTRUCCION',         name: 'Construcción' },
      { code: 'SALUD_FARMA',          name: 'Salud y Farma' },
      { code: 'VARIOS',               name: 'Varios' },
      { code: 'PESCA',                name: 'Pesca' },
      { code: 'GOBIERNO',             name: 'Gobierno' },
      { code: 'INMOBILIARIO',         name: 'Inmobiliario' },
      { code: 'ACELERADORA',          name: 'Aceleradora' },
      { code: 'MARKETING',            name: 'Marketing' },
      { code: 'PUBLICIDAD',           name: 'Publicidad' },
      { code: 'LOGISTICA_SUMINISTRO', name: 'Logistica y Suministro' },
      { code: 'SEGUROS',              name: 'Seguros' },
      { code: 'TELECOMUNICACIONES',   name: 'Telecomunicaciones' },
      { code: 'CONSUMO_MASIVO',       name: 'Consumo Masivo' },
      { code: 'HIDROCARBUROS',        name: 'Hidrocarburos' },
      { code: 'SERVICIOS',            name: 'Servicios' },
      { code: 'HOTELERIA_TURISMO',    name: 'Hoteleria y Turismo' },
      { code: 'INDUSTRIAL',           name: 'Industrial' },
      { code: 'ENERGIA',              name: 'Energía' },
      { code: 'CEMENTOS',             name: 'Cementos' },
      { code: 'EDUCACION',            name: 'Educación' },
      { code: 'MINERIA',              name: 'Minería' },
      { code: 'INST_DEPORTIVAS',      name: 'Instituciones Deportivas' },
      { code: 'AUTOMOTRIZ',           name: 'Automotriz' },
      { code: 'ONG',                  name: 'ONG' },
      { code: 'BELLEZA',              name: 'Belleza' },
    ],
    skipDuplicates: true,
  });

  await prisma.teams.createMany({
    data: [
      { code: 'UI',                  name: 'U.Interface' },
      { code: 'UX',                  name: 'U.Experience' },
      { code: 'BRANDING',            name: 'Branding' },
      { code: 'CLIENTE',             name: 'Cliente' },
      { code: 'DIRECTOR',            name: 'Director' },
      { code: 'SEO',                 name: 'SEO' },
      { code: 'OUTSOURCING',         name: 'Outsourcing' },
      { code: 'ADMINISTRATIVO',      name: 'Administrativo' },
      { code: 'SOCIAL_MEDIA',        name: 'Social Media' },
      { code: 'ESTRATEGIA',          name: 'Estrategia' },
      { code: 'PRODUCTO',            name: 'Producto' },
      { code: 'DISENIO_EXPERIENCIA', name: 'Diseño de Experiencia' },
      { code: 'TECNOLOGIA',          name: 'Tecnología' },
    ],
    skipDuplicates: true,
  });

  await prisma.areas.createMany({
    data: [
      { code: 'TALENTO_CULTURA',     name: 'Talento & Cultura' },
      { code: 'COMERCIAL',           name: 'Comercial' },
      { code: 'PRODUCTO',            name: 'Producto' },
      { code: 'TECNOLOGIA',          name: 'Tecnología' },
      { code: 'ESTRATEGIA',          name: 'Estrategia' },
      { code: 'ADMINISTRACION',      name: 'Administración' },
      { code: 'DISENIO_EXPERIENCIA', name: 'Diseño de Experiencia' },
      { code: 'OUTSOURCING',         name: 'Outsourcing' },
    ],
    skipDuplicates: true,
  });

  await prisma.project_segmentation.createMany({
    data: [
      { code: 'I001',         name: 'I001 - Redes Sociales' },
      { code: 'I002',         name: 'I002 - Diseño y Desarrollo de Producto' },
      { code: 'I002_DIGITAL', name: 'I002 - Diseño y Desarrollo Digital de Producto' },
      { code: 'I003',         name: 'I003 - Branding' },
      { code: 'I004',         name: 'I004 - Product & Experience Design' },
      { code: 'I005',         name: 'I005 - SEO' },
      { code: 'I006',         name: 'I006 - Otros' },
      { code: 'I007',         name: 'I007 - Partnerships' },
      { code: 'I008',         name: 'I008 - Staff Augmentation' },
    ],
    skipDuplicates: true,
  });

  await prisma.project_categories.createMany({
    data: [
      { code: 'DESIGN_PARTNERSHIP_SQUAD',    name: 'Design Partnership Squad' },
      { code: 'DEV_PARTNERSHIP_SQUAD',       name: 'Development Partnership Squad' },
      { code: 'INVESTIGACION_RETO',          name: 'Investigacion de reto' },
      { code: 'E_COMMERCE',                  name: 'E - Commerce' },
      { code: 'GESTION_ESTRATEGIA_MEDIOS',   name: 'Gestion Estrategia de Medios' },
      { code: 'STAFF_AUG_DEV',               name: 'Staff Augmentation - Development' },
      { code: 'PAGINA_WEB_CORPORATIVA',      name: 'Pagina Web Corporativa' },
      { code: 'BOLSA_HORAS_DEV',             name: 'Bolsa de Horas - Development' },
      { code: 'INTERNO_SEEK',                name: 'Interno - Seek' },
      { code: 'BOLSA_HORAS_DISENO',          name: 'Bolsa de Horas - Diseño y experiencia' },
      { code: 'LANDING_PAGE',                name: 'Landing Page' },
      { code: 'PROD_DIG_DISENO_DEV',         name: 'Producto Digital - Diseño y Desarrollo' },
      { code: 'PROD_DIG_E2E',                name: 'Producto Digital - End to End' },
      { code: 'PROD_DIG_INV_DISENO',         name: 'Producto Digital - Investigación y Diseño' },
      { code: 'MINISITE',                    name: 'Minisite' },
      { code: 'PROD_DIG_DISENO_PROD',        name: 'Producto Digital - Diseño de Producto' },
      { code: 'ESTRATEGIA_SEO',              name: 'Estrategia SEO' },
      { code: 'DISENO_SERVICIO',             name: 'Diseño de Servicio' },
      { code: 'PROGRAMA_FIDELIZACION',       name: 'Programa Fidelizacion' },
      { code: 'SERVICIOS_DESARROLLO',        name: 'Servicios de desarrollo' },
      { code: 'BRANDING_SERVICIOS_DISENO',   name: 'Branding servicios diseño' },
      { code: 'ESTRATEGIA_DIG_SOCIAL_MEDIA', name: 'Estrategia Digital - Social Media' },
      { code: 'BRANDING',                    name: 'Branding' },
      { code: 'ESTRATEGIA_DIG_TOOLKIT',      name: 'Estrategia Digital - Tool Kit' },
      { code: 'EVAL_HEURISTICA_UX',          name: 'Evaluacion Heuristica y Auditoría UX' },
      { code: 'BRANDING_BRAND_BOOK',         name: 'Branding - Brand Book' },
      { code: 'BRANDING_OTROS',              name: 'Branding - Otros Servicios' },
      { code: 'ESTRATEGIA_DIG_OTROS',        name: 'Estrategia Digital - Otros' },
      { code: 'STAFF_AUG_DESIGN',            name: 'Staff Augmentation - Design' },
      { code: 'DISENO_ESTRATEGICO',          name: 'Diseño estratégico' },
      { code: 'RECLUTAMIENTO',               name: 'Reclutamiento' },
      { code: 'CAPACITACION',                name: 'Capacitación' },
      { code: 'COMERCIAL',                   name: 'Comercial' },
      { code: 'AREA',                        name: 'Área' },
    ],
    skipDuplicates: true,
  });

  await prisma.productivity_layers.createMany({
    data: [
      { code: 'OPERATIONAL_BACKBONE', name: 'Operational Backbone' },
      { code: 'CULTURE_BUILDERS',     name: 'Culture Builders' },
      { code: 'GROWTH_LEAPS',         name: 'Growth Leaps' },
    ],
    skipDuplicates: true,
  });

  await prisma.profiles.createMany({
    data: [
      { code: 'ADMIN',  name: 'Administradores', description: 'Acceso total al sistema' },
      { code: 'SEEKER', name: 'Seekers',         description: 'Registro de horas trabajadas' },
      { code: 'GESTOR', name: 'Gestores',        description: 'Aprobación de horas del equipo' },
    ],
    skipDuplicates: true,
  });

  // Admin user — get first team to satisfy FK
  const adminTeam = await prisma.teams.findFirst();
  if (!adminTeam) throw new Error('No teams found — seed order issue');

  const existingAdmin = await prisma.users.findUnique({ where: { email: 'admin@seekglobal.co' } });
  if (!existingAdmin) {
    const adminUser = await prisma.users.create({
      data: {
        email:           'admin@seekglobal.co',
        // Password: Admin123! (bcrypt 10 rounds) — change in production
        password_hash:   '$2a$10$k7CkE/Pwe48IjA.zsQdfAOUJRImHuxUsqXjx318MM9y79wVxxxJeC',
        first_name:      'Admin',
        last_name:       'Seekops',
        document_number: '00000001',
        position:        'Administrador del Sistema',
        team_id:         adminTeam.id,
        hire_date:       new Date('2024-01-01'),
        is_active:       true,
        is_staff:        true,
        is_superuser:    true,
      },
    });

    const adminProfile = await prisma.profiles.findUnique({ where: { code: 'ADMIN' } });
    if (adminProfile) {
      await prisma.user_profile.create({
        data: { user_id: adminUser.id, profile_id: adminProfile.id },
      });
    }
  }

  // Periods — Jan 2026 to May 2028; Jan–Mar 2026 closed
  const periodsData: { month: number; year: number; is_closed: boolean }[] = [];
  const endDate = new Date('2028-05-01');
  const cur = new Date('2026-01-01');
  while (cur <= endDate) {
    const month = cur.getMonth() + 1;
    const year = cur.getFullYear();
    periodsData.push({ month, year, is_closed: year === 2026 && month <= 3 });
    cur.setMonth(cur.getMonth() + 1);
  }
  await prisma.periods.createMany({ data: periodsData, skipDuplicates: true });

  await prisma.document_types.createMany({
    data: [
      { name: 'Orden de Compra' },
      { name: 'Contrato' },
      { name: 'Propuesta' },
      { name: 'Addendum' },
      { name: 'Carta de Intención' },
      { name: 'Factura Proforma' },
      { name: 'Otro' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
