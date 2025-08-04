import { Router } from 'express';
import multer from 'multer';
import BookController from '../http/controllers/books-controller';
import { authMiddleware } from '../middlewares/auth';
import { uploadConfig } from '../config/cloudn';

const bookRouter = Router();

// Aplica o middleware de autenticação em todas as rotas
bookRouter.use(authMiddleware);

bookRouter.get(
    '/', 
    BookController.index
)

bookRouter.get(
    '/:id',
    BookController.show
)

bookRouter.post(
    '/', 
    uploadConfig.single('coverImage'), 
    BookController.create
)

bookRouter.patch(
    '/:id/rating', 
    BookController.updateRating
  );

bookRouter.patch(
    '/:id/mark-as-read',
    BookController.markAsRead
)

bookRouter.put(
    '/:id', 
    uploadConfig.single('coverImage'), 
    BookController.update
)

bookRouter.delete(
    '/:id', 
    BookController.delete
)

bookRouter.get(
    '/category/:categoryId', 
    BookController.byCategory
)

export default bookRouter;