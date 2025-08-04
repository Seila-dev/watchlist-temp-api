import { PrismaClient, Category } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCategoryDTO {
  name: string;
  userId: number;
}

interface UpdateCategoryDTO {
  id: string;
  name: string;
  userId: number;
}

class CategoryService {
  async createCategory({ name, userId }: CreateCategoryDTO): Promise<Category> {
    // Verifica se já existe uma categoria com o mesmo nome para este usuário
    const categoryExists = await prisma.category.findFirst({
      where: {
        name,
        userId,
      },
    });

    if (categoryExists) {
      throw new Error('Já existe uma categoria com este nome');
    }

    const category = await prisma.category.create({
      data: {
        name,
        userId,
      },
    });

    return category;
  }

  async getAllCategories(userId: number) {
    const categories = await prisma.category.findMany({
      where: {
        userId,
      },
      include: {
        books: {
          include: {
            book: true
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories;
  }

  async getCategoryById(id: string, userId: number) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    return category;
  }

  async updateCategory({ id, name, userId }: UpdateCategoryDTO) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    // Verifica se já existe outra categoria com o mesmo nome para este usuário
    const categoryWithSameName = await prisma.category.findFirst({
      where: {
        name,
        userId,
        id: {
          not: id,
        },
      },
    });

    if (categoryWithSameName) {
      throw new Error('Já existe uma categoria com este nome');
    }

    const updatedCategory = await prisma.category.update({
      where: {
        id,
      },
      data: {
        name,
      },
    });

    return updatedCategory;
  }

  async deleteCategory(id: string, userId: number) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    await prisma.category.delete({
      where: {
        id,
      },
    });

    return true;
  }
}

export default new CategoryService();