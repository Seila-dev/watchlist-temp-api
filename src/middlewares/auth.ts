import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../prisma'

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.headers['authorization']?.split(' ')[1]

        if (!token) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        const secretKey = process.env.SECRET_KEY

        if(!secretKey) {
            throw new Error('SECRET_KEY is not defined in the environment variables')
        }

        const payload = jwt.verify(token, secretKey) as { id: number, email: string }

        const user = await prisma.user.findUnique({
            where: {
                id: payload.id
            }
        })

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' })
            return
        }

        const { passwordHash, ...loggedUser} = user

        req.user = loggedUser

        next()

    } catch (error) {
        res.status(401).json({ message: 'Failed authenticate token' })
    }


}