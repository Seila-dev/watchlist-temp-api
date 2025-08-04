import "dotenv/config"
import { app } from "./app";
import usersRoutes from "./routes/users-routes";
import googleAuthRouter from './routes/google-auth-routes'

const port = 3000;

// const publicPath = path.join(process.cwd(), 'public'); 

app.use(googleAuthRouter)
app.use("/users", usersRoutes)

app.listen(port, () => {
    console.log(`servidor aberto na porta ${port}`);
})