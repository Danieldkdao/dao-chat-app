import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.ts";
import { route as userRoute } from "./routes/user-route.ts";
import { route as chatRoute } from "./routes/chat-route.ts";
import { errorHandlingMiddleware } from "./middleware/middlewares.ts";
import { createServer } from "http";
import { initializeSocket } from "./utils/socket.ts";
import { keepOpen } from "./config/cron.ts";

const app = express();
keepOpen.start()
const httpServer = createServer(app);
initializeSocket(httpServer);

app.use(
  cors({
    origin: process.env.FRONTEND_URL!,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use("/users", userRoute);
app.use("/chats", chatRoute);

app.use(errorHandlingMiddleware);

const PORT = process.env.PORT || 8000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, from the Dao Chat App backend!");
});

httpServer.listen(PORT, () =>
  console.log(`Server up and running on port ${PORT}`),
);
