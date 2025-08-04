import { Router } from "express";
import { AuthController } from "../http/controllers/auth-controller";
import { googleAuth } from "../http/controllers/auth-google-controller";

const authRoutes = Router();
const authController = new AuthController();

// 1. Login com Google (já existente)
authRoutes.post("/", googleAuth);

// 2. Enviar código para validar email
authRoutes.post("/send-verification-code", (req, res) => authController.sendVerificationCode(req, res));

// 3. Validar código de verificação de email
authRoutes.post("/validate-verification-code", authController.validateVerificationCode);

// 4. Enviar código para redefinir senha
authRoutes.post("/send-password-reset-code", authController.sendPasswordResetCode);

// 5. Validar código para redefinir senha
authRoutes.post("/validate-password-reset-code", authController.validatePasswordResetCode);

// 6. Alterar senha no banco de dados
authRoutes.put("/reset-password", authController.resetPassword);

export default authRoutes;