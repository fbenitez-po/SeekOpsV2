import {Router} from "express";
import {verificarToken} from "../middlewares/auth";
import {prisma} from "../lib/prisma";

const router = Router();

router.use(verificarToken);

router.get("/teams", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.team.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/areas", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.area.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/groups", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.userGroup.findMany({ select: { id: true, code: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/income-categories", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.incomeCategory.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/client-segmentations", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.clientSegmentation.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/client-sectors", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.clientSector.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/client-categories", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.clientCategory.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/project-segmentations", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.projectSegmentation.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/project-categories", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.projectCategory.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/productivity-layers", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.productivityLayer.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

router.get("/service-types", async (_req: any, res: any, next: any) => {
  try {
    const rows = await prisma.serviceType.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } });
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
