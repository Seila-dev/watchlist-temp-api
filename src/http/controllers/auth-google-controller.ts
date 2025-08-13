import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // ou use global fetch se Node >=18
import { prisma } from '../../prisma';

export const googleAuth = async (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Missing Google authorization code' });
  }

  try {
    // Troca o code por tokens
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

    const tokenData = await tokenResponse.json();

    if (!tokenData.id_token) {
      console.error('[GOOGLE TOKEN ERROR]', tokenData);
      return res.status(400).json({ message: 'Failed to get ID token from Google' });
    }

    // Decodifica o ID token para pegar os dados do usuário
    const decoded: any = JSON.parse(
      Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
    );

    if (!decoded.email || !decoded.name) {
      return res.status(400).json({ message: 'Google account missing required data' });
    }

    // Verifica ou cria usuário no banco
    let user = await prisma.user.findUnique({ where: { email: decoded.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: decoded.email,
          name: decoded.name,
          passwordHash: '', // obrigatório, mas vazio
          isEmailVerified: true,
        },
      });
    } else if (!user.isEmailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    }

    // Gera JWT próprio
    const jwtToken = jwt.sign({ id: user.id, email: user.email }, process.env.SECRET_KEY!, {
      expiresIn: '7d',
    });

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { passwordHash, ...safeUser } = user;
    return res.json({ user: safeUser, token: jwtToken });
  } catch (error) {
    console.error('[GOOGLE AUTH ERROR]', error);
    return res.status(500).json({ message: 'Google authentication failed' });
  }
};