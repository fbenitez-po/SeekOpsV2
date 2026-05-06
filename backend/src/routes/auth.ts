import {Router} from "express";
import {body} from "express-validator";
import {validate} from "../middlewares/validate";
import {verificarToken} from "../middlewares/auth";
import * as authService from "../services/authService";

const router = Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("email inválido"),
    body("password").notEmpty().withMessage("password es requerido"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const resultado = await authService.login(req.body.email, req.body.password);
      res.status(201).json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.post("/logout", verificarToken, async (req: any, res: any, next: any) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) await authService.logout(refreshToken);
    res.json({ message: "Sesión cerrada correctamente" });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/refresh-token",
  [body("refreshToken").notEmpty().withMessage("refreshToken es requerido")],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const resultado = await authService.refreshAccessToken(req.body.refreshToken);
      res.json(resultado);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/solicitar-reset",
  [body("email").isEmail().withMessage("email inválido")],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      await authService.requestPasswordReset(req.body.email);
      res.json({ message: "Si el email existe, recibirás instrucciones en breve." });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/confirmar-reset",
  [
    body("token").notEmpty().withMessage("token es requerido"),
    body("newPassword").isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
    body("confirmPassword").notEmpty().withMessage("confirmPassword es requerido"),
  ],
  validate,
  async (req: any, res: any, next: any) => {
    try {
      const { token, newPassword, confirmPassword } = req.body;
      await authService.confirmPasswordReset(token, newPassword, confirmPassword);
      res.json({ message: "Contraseña actualizada correctamente" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
