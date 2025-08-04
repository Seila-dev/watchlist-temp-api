import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = async (req: Request, res: Response) => {
  const { token: googleToken } = req.body;
    console.log('[GOOGLE AUTH REQUEST]', req.body);

  if (!googleToken) {
    res.status(400).json({ message: 'Missing Google token' });
    return
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.name) {
      res.status(400).json({ message: 'Google account missing required data' });
      return
    }

    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          username: payload.name,
          passwordHash: '', // campo obrigatório, pode deixar vazio ou um valor simbólico
        },
      });
    }

    const secretKey = process.env.SECRET_KEY!;
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, secretKey, {
      expiresIn: '7d',
    });

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser, token: jwtToken });
  } catch (error) {
    console.error('[GOOGLE AUTH ERROR]', error);
    res.status(500).json({ message: 'Google authentication failed' });
    return
  }
};