import {Router} from "express";
import {body} from "express-validator";
import {validate} from "../middlewares/validate";
import {verificarToken} from "../middlewares/auth";
import * as service from "../services/timeEntryService";

const router = Router();

router.use(verificarToken);

router.get("/", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    res.json(await service.listar(userId, roles, req.query));
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  [
    body("week").matches(/^S\d{2}\/\d{2}$/).withMessage("week debe tener formato S15/26"),
    body("lines").isArray({ min: 1 }).withMessage("lines debe ser un array con al menos un elemento"),
    body("lines.*.projectId").isUUID().withMessage("projectId inválido"),
    body("lines.*.hours").isInt({ min: 0 }).withMessage("hours debe ser un número mayor o igual a 0"),
    body("lines.*.extraHours").optional().isInt({ min: 0, max: 8 }).withMessage("extraHours debe ser entre 0 y 8"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { userId, roles } = req.user;
      res.status(201).json(await service.crear(userId, roles, req.body));
    } catch (err) {
      next(err);
    }
  }
);

router.get("/missing-weeks", async (req: any, res: any, next: any) => {
  try {
    const { userId } = req.user;
    res.json(await service.obtenerSemanasSinCarga(userId));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    res.json(await service.obtenerPorId(req.params.id, userId, roles));
  } catch (err) {
    next(err);
  }
});

router.put(
  "/:id",
  [
    body("lines").isArray({ min: 1 }).withMessage("lines es requerido"),
    body("lines.*.id").isUUID().withMessage("id de línea inválido"),
    body("lines.*.hours").isInt({ min: 0 }).withMessage("hours debe ser un número mayor o igual a 0"),
    body("lines.*.extraHours").optional().isInt({ min: 0, max: 8 }).withMessage("extraHours debe ser entre 0 y 8"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { userId } = req.user;
      res.json(await service.ajustar(req.params.id, userId, req.body.lines));
    } catch (err) {
      next(err);
    }
  }
);

router.post("/:id/approve", async (req: any, res: any, next: any) => {
  try {
    const { userId, roles } = req.user;
    res.json(await service.aprobar(req.params.id, userId, roles));
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/observe",
  [body("comment").notEmpty().withMessage("comment es requerido")],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { userId, roles } = req.user;
      res.json(await service.observar(req.params.id, userId, roles, req.body));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/reject",
  [body("rejectionReason").notEmpty().withMessage("rejectionReason es requerida")],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { userId, roles } = req.user;
      res.json(await service.rechazar(req.params.id, userId, roles, req.body));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
