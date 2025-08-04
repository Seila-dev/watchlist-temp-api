import { PrismaClient, Note } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateNoteDTO {
  content: string;
  bookId: string;
  userId: number;
}

interface UpdateNoteDTO {
  id: string;
  content: string;
  userId: number;
}

class NoteService {
  async createNote({
    content,
    bookId,
    userId,
  }: CreateNoteDTO): Promise<Note> {
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId,
      },
    });

    if (!book) {
      throw new Error('Livro não encontrado');
    }

    const note = await prisma.note.create({
      data: {
        content,
        bookId,
        userId,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return note;
  }

  async getNotesByBook(bookId: string, userId: number) {
    const book = await prisma.book.findFirst({
      where: {
        id: bookId,
        userId,
      },
    });

    if (!book) {
      throw new Error('Livro não encontrado');
    }

    const notes = await prisma.note.findMany({
      where: {
        bookId,
        userId,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notes;
  }

  async getAllNotesByUser(userId: number) {
    const notes = await prisma.note.findMany({
      where: {
        userId,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notes;
  }

  async getNoteById(id: string, userId: number) {
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!note) {
      throw new Error('Anotação não encontrada');
    }

    return note;
  }

  async updateNote({
    id,
    content,
    userId,
  }: UpdateNoteDTO) {
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!note) {
      throw new Error('Anotação não encontrada');
    }

    const updatedNote = await prisma.note.update({
      where: {
        id,
      },
      data: {
        content,
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updatedNote;
  }

  async deleteNote(id: string, userId: number) {
    const note = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!note) {
      throw new Error('Anotação não encontrada');
    }

    await prisma.note.delete({
      where: {
        id,
      },
    });

    return true;
  }

  async searchNotes(userId: number, search: string) {
    const notes = await prisma.note.findMany({
      where: {
        userId,
        content: {
          contains: search,
          mode: 'insensitive',
        },
      },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            coverImage: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notes;
  }
}

export default new NoteService();