import { Router } from 'express';
import CategoryController from '../http/controllers/category-controller';
import { authMiddleware } from '../middlewares/auth';

const categoryRouter = Router();

// Aplica o middleware de autenticação em todas as rotas
categoryRouter.use(authMiddleware);

categoryRouter.get(
    '/', 
    CategoryController.index
)

categoryRouter.get(
    '/:id', 
    CategoryController.show
)

categoryRouter.post(
    '/', 
    CategoryController.create
)

categoryRouter.put(
    '/:id', 
    CategoryController.update
)

categoryRouter.delete(
    '/:id', 
    CategoryController.delete
)

export default categoryRouter;