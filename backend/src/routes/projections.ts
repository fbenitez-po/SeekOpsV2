import {Router} from "express";
import {body} from "express-validator";
import {validate} from "../middlewares/validate";
import {soloGestorOAdmin, verificarToken} from "../middlewares/auth";
import * as service from "../services/projectionService";

const router = Router();

router.use(verificarToken, soloGestorOAdmin);

router.get("/alerts", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    const alerts = await service.listarAlertas(userId, roles);
    res.json({ data: alerts });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    const projections = await service.listar(req.query, userId, roles);
    res.json({ data: projections });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  [
    body("projectId").isUUID().withMessage("projectId inválido"),
    body("userId").isUUID().withMessage("userId inválido"),
    body("startDate").isDate().withMessage("startDate inválida (YYYY-MM-DD)"),
    body("endDate").isDate().withMessage("endDate inválida (YYYY-MM-DD)"),
    body("projectedHours").isInt({ min: 1 }).withMessage("projectedHours debe ser entero positivo"),
    body("notes").optional({ nullable: true }).isLength({ max: 500 }).withMessage("notes max 500 caracteres"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { userId, roles } = req.user;
      res.status(201).json(await service.crear(req.body, userId, roles));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  [
    body("startDate").optional().isDate().withMessage("startDate inválida"),
    body("endDate").optional().isDate().withMessage("endDate inválida"),
    body("projectedHours").optional().isInt({ min: 1 }).withMessage("projectedHours debe ser entero positivo"),
    body("notes").optional({ nullable: true }).isLength({ max: 500 }).withMessage("notes max 500 caracteres"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { userId, roles } = req.user;
      res.json(await service.actualizar(req.params.id, req.body, userId, roles));
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    res.json(await service.eliminar(req.params.id, userId, roles));
  } catch (err) {
    next(err);
  }
});

export default router;
