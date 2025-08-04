import { Router } from 'express';
import NoteController from '../http/controllers/note-controller';
import { authMiddleware } from '../middlewares/auth'; // Assumindo que você tem um middleware de autenticação

const noteRoutes = Router();

noteRoutes.use(authMiddleware);

noteRoutes.post('/', NoteController.create);

noteRoutes.get('/', NoteController.index);

noteRoutes.get('/:id', NoteController.show);

noteRoutes.put('/:id', NoteController.update);

noteRoutes.delete('/:id', NoteController.delete);

noteRoutes.get('/book/:bookId', NoteController.getByBook);

export default noteRoutes;