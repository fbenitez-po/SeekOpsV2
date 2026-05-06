import "dotenv/config";
import express from "express";
import cors from "cors";
import {errorHandler} from "./middlewares/errorHandler";

import authRoutes from "./routes/auth";
import timeEntryRoutes from "./routes/timeEntries";
import userRoutes from "./routes/users";
import clientRoutes from "./routes/clients";
import projectRoutes from "./routes/projects";
import configRoutes from "./routes/config";
import projectionRoutes from "./routes/projections";

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/time-entries", timeEntryRoutes);
app.use("/users", userRoutes);
app.use("/clients", clientRoutes);
app.use("/projects", projectRoutes);
app.use("/config", configRoutes);
app.use("/projections", projectionRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(errorHandler);

export default app;
