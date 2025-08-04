import { Response } from 'express';

export function handleError(error: Error, res: Response) {
  console.error(error);
  res.status(500).json({
    status: 'error',
    message: 'Erro interno do servidor',
  });
}