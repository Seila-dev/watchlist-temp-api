import { Request, Response } from 'express';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma';

export const googleAuth = async (req: Request, res: Response) => {
  const { code } = req.body; // agora recebemos o code
  console.log('[GOOGLE AUTH REQUEST]', req.body);

  if (!code) {
    res.status(400).json({ message: 'Missing Google code' });
    return;
  }

  try {
    // Troca code por tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `https://your-watchlist.vercel.app/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();
    if (!tokens.id_token) {
      res.status(400).json({ message: 'Failed to get ID token from Google' });
      return;
    }

    // Decodifica o id_token para pegar info do usuário
    const base64Payload = tokens.id_token.split('.')[1];
    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());

    if (!payload.email || !payload.name) {
      res.status(400).json({ message: 'Google account missing required data' });
      return;
    }

    // Procura usuário no DB
    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          name: payload.name,
          passwordHash: '',
          isEmailVerified: true,
        },
      });
    } else if (!user.isEmailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }

    // Cria JWT
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
    return;
  }
};
