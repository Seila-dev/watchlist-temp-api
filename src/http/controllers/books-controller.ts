import { Request, Response } from 'express';
import BookService from '../../services/book-service';
import { handleError } from '../../errors';

class BookController {
  async create(request: Request, response: Response) {
    try {
      const {
        title,
        description,
        rating,
        startDate,
        finishDate,
        categoryIds,
      } = request.body;

      // Com Cloudinary, a imagem upload já fornece a URL completa
      const coverImage = request.file ? request.file.path : undefined;
      const userId = request.user.id;

      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedFinishDate = finishDate ? new Date(finishDate) : undefined;
      const parsedRating = rating ? parseInt(rating, 10) : undefined;

      const book = await BookService.createBook({
        title,
        coverImage,
        description,
        rating: parsedRating,
        startDate: parsedStartDate,
        finishDate: parsedFinishDate,
        userId,
        categoryIds: categoryIds ? JSON.parse(categoryIds) : undefined,
      });

      response.status(201).json(book);
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

      const books = await BookService.getAllBooks(userId, search);

      response.json(books);
    } catch (error) {
      handleError(error as Error, response);
    }
  }

  async show(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      const book = await BookService.getBookById(id, userId);

      response.json(book);
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
      const {
        title,
        description,
        rating,
        startDate,
        finishDate,
        isFavorite
      } = request.body;

      const userId = request.user.id;
      const coverImage = request.file ? request.file.path : undefined;

      const parsedStartDate = startDate === ''
        ? null
        : startDate
          ? new Date(startDate)
          : undefined;

      const parsedFinishDate = finishDate === ''
        ? null
        : finishDate
          ? new Date(finishDate)
          : undefined;

      const parsedRating = rating !== undefined
        ? parseInt(rating, 10)
        : undefined;

      const parsedIsFavorite = typeof isFavorite === 'string'
        ? isFavorite === 'true'
        : undefined;

      // Tratamento robusto de categoryIds (string ou array)
      let parsedCategoryIds: string[] | undefined = undefined;
      if (request.body.categoryIds) {
        if (typeof request.body.categoryIds === 'string') {
          try {
            parsedCategoryIds = JSON.parse(request.body.categoryIds);
          } catch {
            parsedCategoryIds = request.body.categoryIds.split(',');
          }
        } else if (Array.isArray(request.body.categoryIds)) {
          parsedCategoryIds = request.body.categoryIds;
        }
      }

      const book = await BookService.updateBook({
        id,
        title,
        coverImage,
        description,
        rating: parsedRating,
        startDate: parsedStartDate,
        finishDate: parsedFinishDate,
        userId,
        categoryIds: parsedCategoryIds,
        isFavorite: parsedIsFavorite
      });

      response.json(book);
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

      await BookService.deleteBook(id, userId);

      response.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        response.status(404).json({ error: error.message });
      }
      handleError(error as Error, response);
    }
  }

  async updateRating(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const { rating } = request.body; // A nota do livro (deve ser um número de 1 a 5)
      const userId = request.user.id;

      if (rating < 1 || rating > 5) {
        throw new Error('A avaliação deve ser entre 1 e 5 estrelas');
      }

      const updatedBook = await BookService.updateBookRating(id, rating, userId);

      response.json(updatedBook);
    } catch (error) {
      handleError(error as Error, response);
    }
  }


  async byCategory(request: Request, response: Response) {
    try {
      const { categoryId } = request.params;
      const userId = request.user.id;

      const books = await BookService.getBooksByCategory(categoryId, userId);

      response.json(books);
    } catch (error) {
      handleError(error as Error, response);
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const updatedBook = await BookService.updateBook({
        id,
        userId,
        finishDate: new Date(),
      });

      res.json(updatedBook);
    } catch (error) {
      handleError(error as Error, res);
    }
  }
}

export default new BookController();