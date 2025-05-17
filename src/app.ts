import "reflect-metadata";
import express from "express";
import authRouter from "./routes/auth";
import tenantRouter from "./routes/tenant";
import userRouter from "./routes/user";
import cookieParser from "cookie-parser";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/globalErrorHandler";
const app = express();
app.use(
  cors({
    origin: ["http://localhost:5174"],
    credentials: true,
  }),
);
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Welcome to auth service");
});
app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

// global error handler
app.use(globalErrorHandler);

export default app;
