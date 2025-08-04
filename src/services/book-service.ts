import { PrismaClient, Book } from '@prisma/client';
import { cloudinary, deleteImage, extractPublicId } from '../config/cloudn';

const prisma = new PrismaClient();

interface CreateBookDTO {
  title: string;
  coverImage?: string;
  description?: string;
  rating?: number;
  startDate?: Date;
  finishDate?: Date;
  userId: number;
  categoryIds?: string[];
}

interface UpdateBookDTO {
  id: string;
  title?: string;
  coverImage?: string;
  description?: string;
  rating?: number;
  startDate?: Date | null;
  finishDate?: Date | null;
  userId: number;
  isFavorite?: boolean;
  categoryIds?: string[];
}

class BookService {
  async createBook({
    title,
    coverImage,
    description,
    rating,
    startDate,
    finishDate,
    userId,
    categoryIds,
  }: CreateBookDTO): Promise<Book> {
    const book = await prisma.book.create({
      data: {
        title,
        coverImage,
        description,
        rating: rating || 0,
        startDate,
        finishDate,
        userId,
        categories: categoryIds?.length
          ? {
              create: categoryIds.map(categoryId => ({
                category: {
                  connect: { id: categoryId },
                },
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return book;
  }

  async getAllBooks(userId: number, search?: string) {
    const books = await prisma.book.findMany({
      where: {
        userId,
        ...(search && {
          title: {
            contains: search,
            mode: 'insensitive'
          },
        }),
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return books;
  }

  async getBookById(id: string, userId: number) {
    const book = await prisma.book.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!book) {
      throw new Error('Livro não encontrado');
    }

    return book;
  }

  async updateBook({
    id,
    title,
    coverImage,
    description,
    rating,
    startDate,
    finishDate,
    userId,
    categoryIds,
    isFavorite
  }: UpdateBookDTO) {
    const book = await prisma.book.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!book) {
      throw new Error('Livro não encontrado');
    }

    if (coverImage && book.coverImage && coverImage !== book.coverImage) {
      const publicId = extractPublicId(book.coverImage);
      try {
        await deleteImage(publicId);
      } catch (err) {
        console.warn('Erro ao excluir imagem do Cloudinary:', err);
      }
    }    

    if (categoryIds) {
      await prisma.categoriesOnBooks.deleteMany({
        where: {
          bookId: id,
        },
      });

      for (const categoryId of categoryIds) {
        await prisma.categoriesOnBooks.create({
          data: {
            bookId: id,
            categoryId,
          },
        });
      }
    }

    const updatedBook = await prisma.book.update({
      where: {
        id,
      },
      data: {
        title,
        coverImage,
        description,
        rating,
        startDate,
        finishDate,
        isFavorite
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    return updatedBook;
  }

  async deleteBook(id: string, userId: number) {
    const book = await prisma.book.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!book) {
      throw new Error('Livro não encontrado');
    }

    // Se o livro tiver uma imagem, exclui do Cloudinary
    if (book.coverImage) {
      const publicId = extractPublicId(book.coverImage);
      await deleteImage(publicId);
    }

    await prisma.book.delete({
      where: {
        id,
      },
    });

    return true;
  }

  async updateBookRating(id: string, rating: number, userId: number): Promise<Book> {
    const book = await prisma.book.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!book) {
      throw new Error('Livro não encontrado');
    }

    const updatedBook = await prisma.book.update({
      where: {
        id,
      },
      data: {
        rating,
      },
    });

    return updatedBook;
  }

  async getBooksByCategory(categoryId: string, userId: number) {
    const books = await prisma.book.findMany({
      where: {
        userId,
        categories: {
          some: {
            categoryId,
          },
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return books;
  }
}

export default new BookService();