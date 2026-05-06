import {Router} from "express";
import {body} from "express-validator";
import {validate} from "../middlewares/validate";
import {soloAdmin, verificarToken} from "../middlewares/auth";
import * as service from "../services/projectService";

const router = Router();

router.use(verificarToken);

router.get("/", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    res.json(await service.listar(req.query, userId, roles));
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  soloAdmin,
  [
    body("code").matches(/^[a-zA-Z0-9-]{1,20}$/).withMessage("code inválido (alfanumérico + guiones, max 20)"),
    body("name").notEmpty().isLength({ max: 100 }).withMessage("name es requerido (max 100)"),
    body("clientId").isUUID().withMessage("clientId inválido"),
    body("managerId").isUUID().withMessage("managerId inválido"),
    body("segmentationId").optional({ nullable: true }).isUUID().withMessage("segmentationId inválido"),
    body("categoryIds").optional({ nullable: true }).isArray().withMessage("categoryIds debe ser un array"),
    body("categoryIds.*").isUUID().withMessage("cada categoría debe ser un UUID válido"),
    body("areaId").optional({ nullable: true }).isUUID().withMessage("areaId inválido"),
    body("startDate").optional({ nullable: true }).isDate().withMessage("startDate inválida"),
    body("endDate").optional({ nullable: true }).isDate().withMessage("endDate inválida"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      res.status(201).json(await service.crear(req.body));
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    res.json(await service.obtenerPorId(req.params.id, userId, roles));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", soloAdmin, async (req: any, res: any, next: any) => {
  try {
    res.json(await service.actualizar(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/toggle-activo", soloAdmin, async (req: any, res: any, next: any) => {
  try {
    res.json(await service.toggleActivo(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/members",
  soloAdmin,
  [
    body("members").isArray({ min: 1 }).withMessage("members debe ser un array no vacío"),
    body("members.*.userId").isUUID().withMessage("userId inválido"),
    body("members.*.role").isIn(["SEEKER", "MANAGER"]).withMessage("role debe ser SEEKER o MANAGER"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      res.json(await service.asignarUsuarios(req.params.id, req.body.members));
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id/members/:userId", soloAdmin, async (req: any, res: any, next: any) => {
  try {
    await service.desasignarUsuario(req.params.id, req.params.userId);
    res.json({ message: "Usuario desasignado correctamente" });
  } catch (err) {
    next(err);
  }
});

export default router;
