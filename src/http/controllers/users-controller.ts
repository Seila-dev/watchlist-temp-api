import { Request, Response } from 'express';
import { prisma } from '../../prisma';
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'


export class UsersController {
    async checkEmail(req: Request, res: Response){
        const { email } = req.body

        try {
            const user = await prisma.user.findUnique({
                where: {
                    email
                }
            })

            if(user){
                res.status(409).json({ message: "This email is already in use" })
                return
            }

            res.status(200).json({ message: "Email is avaible"})
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ message: "Erro interno no servidor", error: error.message });
        }
    }
    async create(req: Request, res: Response) {
        try {
            const { username, email, password } = req.body

            const user = await prisma.user.findUnique({
                where: {
                    email
                }
            })

            if (user) {
                res.status(409).json({ message: "User already exists" })
                return
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await prisma.user.create({
                data: {
                    username,
                    email,
                    passwordHash: hashedPassword
                }
            })

            res.status(201).json({ newUser, message: "User created successfully" })
        } catch (error: any) {
            console.error(error)
            res.status(500).json({ message: "Internal Server Error", error: error.message })
        }
    }

    async login(request: Request, response: Response) {
        const { email, password } = request.body

        try {
            const user = await prisma.user.findUnique({
                where: {
                    email
                }
            })

            const secretKey = process.env.SECRET_KEY

            if (!secretKey) {
                throw new Error('SECRET_KEY is not defined in the environment variables')
            }

            if (user && bcrypt.compareSync(password, user.passwordHash)) {
                const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '1h' })
                response.json({ token })
                return
            }

            response.status(401).json({ message: "Invalid credentials" })
        } catch (error) {
            console.error(error)
            response.status(500).send({ message: "Internal server error" })
        }
    }

    async profile(req: Request, res: Response) {
        res.json(req.user)
    }
}