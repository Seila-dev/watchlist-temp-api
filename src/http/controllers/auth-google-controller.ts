import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // ou global fetch se Node >=18
import { prisma } from '../../prisma';

const isDev = process.env.NODE_ENV !== 'production';

export const googleAuth = async (req: Request, res: Response) => {
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    res.status(400).json({ message: 'Missing code or redirectUri' });
  }

  const attemptTokenExchange = async (redirect_to: string) => {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirect_to,
        grant_type: 'authorization_code',
      }),
    });

    const body = await resp.json().catch(() => ({ error: 'invalid_json' }));
    return { 
      status: resp.status, 
      body 
    };
  };

  try {
    // 1) tenta com a redirectUri enviada pelo cliente (essa deve ser a que foi usada no /auth URL)
    const primary = await attemptTokenExchange(redirectUri);
    console.log('[GOOGLE TOKEN TRY] redirectUri=', redirectUri, 'status=', primary.status, 'body=', primary.body);

    // se não veio id_token, e estivermos em dev, tente o redirect registrado no env como diagnóstico
    if (!primary.body?.id_token && isDev && process.env.REDIRECT_URI) {
      const fallback = await attemptTokenExchange(process.env.REDIRECT_URI);
      console.log('[GOOGLE TOKEN FALLBACK] redirectUri=', process.env.REDIRECT_URI, 'status=', fallback.status, 'body=', fallback.body);

      // prefira fallback se ele trouxe id_token
      if (fallback.body?.id_token) {
        primary.body = fallback.body;
      } else {
        // nenhum trouxe id_token -> devolve erro detalhado em dev para inspecionar
        console.error('[GOOGLE TOKEN ERROR] primary and fallback failed', primary.body, fallback.body);
        res.status(400).json({
          message: 'Failed to get ID token from Google',
          googlePrimary: primary.body,
          googleFallback: fallback.body,
        });
      }
    }

    if (!primary.body?.id_token) {
      console.error('[GOOGLE TOKEN ERROR]', primary.body);
      // retornar o body do Google para debug (apenas em dev)
      res.status(400).json({ message: 'Failed to get ID token from Google', google: isDev ? primary.body : undefined });
    }

    const tokenData = primary.body;

    // Decodifica o ID token para pegar os dados do usuário
    const decoded: any = JSON.parse(
      Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString()
    );

    if (!decoded.email || !decoded.name) {
      res.status(400).json({ message: 'Google account missing required data', payload: decoded });
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
    res.json({ user: safeUser, token: jwtToken });
  } catch (error) {
    console.error('[GOOGLE AUTH ERROR]', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};
