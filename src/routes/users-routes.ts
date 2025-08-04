import { Router } from "express";
import { UsersController } from "../http/controllers/users-controller";
import { authMiddleware } from "../middlewares/auth";
import { getCurrentUser } from "../http/controllers/get-current-user-controller";

const usersRoutes = Router()

usersRoutes.post(
    "/check-email", 
    new UsersController().checkEmail
)

usersRoutes.post(
    "/", 
    new UsersController().create
)

usersRoutes.post(
    "/login", 
    new UsersController().login
)

usersRoutes.get(
    '/me', 
    authMiddleware, 
    getCurrentUser
)

usersRoutes.get(
    "/", 
    authMiddleware, 
    new UsersController().profile
)

export default usersRoutes