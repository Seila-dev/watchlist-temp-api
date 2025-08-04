import { Request, Response } from 'express';
import CategoryService from '../../services/category-service';
import { handleError } from '../../errors';

class CategoryController {
  async create(request: Request, response: Response) {
    try {
      const { name } = request.body;
      const userId = request.user.id;

      const category = await CategoryService.createCategory({
        name,
        userId,
      });

      response.status(201).json(category);
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
      const categories = await CategoryService.getAllCategories(userId);

      response.json(categories);
    } catch (error) {
      handleError(error as Error, response);
    }
  }

  async show(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const userId = request.user.id;

      const category = await CategoryService.getCategoryById(id, userId);

      response.json(category);
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
      const { name } = request.body;
      const userId = request.user.id;

      const category = await CategoryService.updateCategory({
        id,
        name,
        userId,
      })

      response.json(category);
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

      await CategoryService.deleteCategory(id, userId);

      response.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        response.status(404).json({ error: error.message });
      }
      handleError(error as Error, response);
    }
  }
}

export default new CategoryController();