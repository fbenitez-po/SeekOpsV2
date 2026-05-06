import {Router} from "express";
import {body} from "express-validator";
import {validate} from "../middlewares/validate";
import {soloAdmin, verificarToken} from "../middlewares/auth";
import * as service from "../services/clientService";

const router = Router();

router.use(verificarToken, soloAdmin);

const baseValidations = [
  body("name").notEmpty().isLength({ max: 100 }).withMessage("name es requerido (max 100)"),
  body("taxId").matches(/^\d{11,14}$/).withMessage("taxId debe tener 11-14 dígitos"),
  body("legalName").optional({ nullable: true }).isLength({ max: 150 }),
  body("commercialName").optional({ nullable: true }).isLength({ max: 150 }),
  body("contactEmail").optional({ nullable: true }).isEmail().withMessage("contactEmail inválido"),
  body("categoryId").isUUID().withMessage("categoryId inválido"),
  body("segmentationId").isUUID().withMessage("segmentationId inválido"),
];

router.get("/", async (req: any, res: any, next: any) => {
  try {
    res.json(await service.listar(req.query));
  } catch (err) {
    next(err);
  }
});

router.post("/", baseValidations, validate, async (req: any, res: any, next: any) => {
  try {
    res.status(201).json(await service.crear(req.body));
  } catch (err) {
    next(err);
  }
});

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
