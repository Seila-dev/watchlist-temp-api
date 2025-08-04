import express from "express";
import path from 'path';
import "dotenv/config"
import { app } from "./app";
import usersRoutes from "./routes/users-routes";
import bookRouter from "./routes/books-routes";
import categoryRouter from "./routes/categories-routes";
import googleAuthRouter from './routes/google-auth-routes'

import cloudinary from 'cloudinary'
import noteRoutes from "./routes/notes-services";

const port = 3000;

// const publicPath = path.join(process.cwd(), 'public'); 

app.use(googleAuthRouter)
app.use("/users", usersRoutes)
app.use('/books', bookRouter)
app.use('/categories', categoryRouter);
app.use('/notes', noteRoutes);

app.listen(port, () => {
    console.log(`servidor aberto na porta ${port}`);
})