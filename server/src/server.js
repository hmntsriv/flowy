const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const http = require("http");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://flow-sandy.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Flowy API is running 🚀");
});

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const userId = decoded.userId;

      socket.userId = userId;

      socket.join(`user:${userId}`);

      console.log(`User ${userId} connected via socket: ${socket.id}`);

      socket.on("note:updated", (note) => {
        const room = `user:${socket.userId}`;

        socket.to(room).emit("note:updated", note);
      });

      socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected: ${socket.id}`);
      });
    } catch (error) {
      console.error("Socket authentication failed:", error.message);

      socket.disconnect();
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
