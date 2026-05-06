import {Router} from "express";
import {body} from "express-validator";
import {validate} from "../middlewares/validate";
import {soloAdmin, verificarToken} from "../middlewares/auth";
import * as service from "../services/userService";

const router = Router();

router.use(verificarToken, soloAdmin);

const baseValidations = [
  body("firstName").notEmpty().isLength({ max: 100 }).withMessage("firstName es requerido (max 100)"),
  body("lastName").notEmpty().isLength({ max: 100 }).withMessage("lastName es requerido (max 100)"),
  body("documentNumber").matches(/^\d{6,20}$/).withMessage("documentNumber debe tener 6-20 dígitos"),
  body("jobTitle").notEmpty().isLength({ max: 100 }).withMessage("jobTitle es requerido (max 100)"),
  body("phone").optional({ checkFalsy: true }).isMobilePhone("any").withMessage("phone con formato inválido"),
  body("teamId").isUUID().withMessage("teamId inválido"),
  body("areas").isArray({ min: 1 }).withMessage("areas debe tener al menos un elemento"),
  body("areas.*").isUUID().withMessage("cada área debe ser un UUID válido"),
  body("hireDate").isDate().withMessage("hireDate inválida"),
  body("groups").isArray({ min: 1 }).withMessage("groups debe tener al menos un elemento"),
];

router.get("/", async (req: any, res: any, next: any) => {
  try {
    res.json(await service.listar(req.query));
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  [body("email").isEmail().withMessage("email inválido"), ...baseValidations],
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
    res.json(await service.obtenerPorId(req.params.id));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", baseValidations, validate, async (req: any, res: any, next: any) => {
  try {
    res.json(await service.actualizar(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/toggle-activo", async (req: any, res: any, next: any) => {
  try {
    res.json(await service.toggleActivo(req.params.id));
  } catch (err) {
    next(err);
  }
});

export default router;
