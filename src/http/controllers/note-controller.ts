import { Request, Response } from 'express';
import NoteService from '../../services/note-service';
import { handleError } from '../../errors';

class NoteController {
  async create(request: Request, response: Response) {
    try {
      const { content, bookId } = request.body;
      const userId = request.user.id;

      if (!content || !bookId) {
        response.status(400).json({ 
          error: 'Conteúdo da anotação e ID do livro são obrigatórios' 
        });
        return
      }

      const note = await NoteService.createNote({
        content,
        bookId,
        userId,
      });

      response.status(201).json(note);
    } catch (error) {
      if (error instanceof Error) {
        response.status(400).json({ error: error.message });
      }
      handleError(error as Error, response);
    }
  }

  async index(request: Request, response: Response) {
    try {
      const userId = request.user.id;
      const search = request.query.search as string | undefined;

      let notes;
      
      if (search) {
        notes = await NoteService.searchNotes(userId, search);
      } else {
        notes = await NoteService.getAllNotesByUser(userId);
      }

      response.json(notes);
    } catch (error) {
      handleError(error as Error, response);
    }
  }

  async show(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      const note = await NoteService.getNoteById(id, userId);

      response.json(note);
    } catch (error) {
      if (error instanceof Error) {
        response.status(404).json({ error: error.message });
      }
      handleError(error as Error, response);
    }
  }

  async update(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { content } = request.body;
      const userId = request.user.id;

      if (!content) {
        response.status(400).json({ 
          error: 'Conteúdo da anotação é obrigatório' 
        });
        return
      }

      const note = await NoteService.updateNote({
        id,
        content,
        userId,
      });

      response.json(note);
    } catch (error) {
      if (error instanceof Error) {
        response.status(400).json({ error: error.message });
      }
      handleError(error as Error, response);
    }
  }

  async delete(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      await NoteService.deleteNote(id, userId);

      response.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        response.status(404).json({ error: error.message });
      }
      handleError(error as Error, response);
    }
  }

  async getByBook(request: Request, response: Response) {
    try {
      const { bookId } = request.params;
      const userId = request.user.id;

      const notes = await NoteService.getNotesByBook(bookId, userId);

      response.json(notes);
    } catch (error) {
      if (error instanceof Error) {
        response.status(404).json({ error: error.message });
      }
      handleError(error as Error, response);
    }
  }
}

export default new NoteController();