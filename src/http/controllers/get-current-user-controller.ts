import { Request, Response } from 'express';
import { prisma } from '../../prisma';

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true }, 
    });

    if (!user) {
        res.status(404).json({ message: 'Usuário não encontrado' });
        return
    }

    res.json({ user });
  } catch (error) {
    console.error('[GET CURRENT USER]', error);
    res.status(500).json({ message: 'Erro ao buscar usuário' });
  }
};