import express from 'express'
import cors from 'cors'
import 'dotenv/config'

export const app = express()

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-watchlist.vercel.app/',
  ],
  credentials: true,
}));

app.use(express.json());