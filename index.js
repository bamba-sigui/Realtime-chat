const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const socket = require("socket.io");

const chatRoute = require("./Routes/chatRoute");
const messageRoute = require("./Routes/messageRoute");
const userRoute = require("./Routes/userRoute");

require("dotenv").config();

const app = express();

app.use(express.json());
app.use(cors(
  crossOriginIsolated=true
));

app.use("/api/users", userRoute);
app.use("/api/chats", chatRoute);
app.use("/api/messages", messageRoute);

app.get("/", (req, res) => {
  res.send("Bienvenue sur notre chat API...");
});

const uri = process.env.ATLAS_URI;
const port = process.env.PORT || 8000;

mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connection etablie..."))
  .catch((error) => console.error("MongoDB connection échouée:", error.message));

server = app.listen(port, () => {
  console.log(`Server en marche sur le port: ${port}...`);
});


const io = socket(server, {
  cors: {
    // Put your frontend url here
    origin: "https://realchatserver.netlify.app",
    credentials: true,
  },
});

let onlineUsers = [];

io.on("connection", (socket) => {
  // ajout d'utilisateur

  socket.on("addNewUser", (userId) => {
    !onlineUsers.some((user) => user.userId === userId) &&
      onlineUsers.push({
        userId,
        socketId: socket.id,
      });

    console.log("Connected Users:", onlineUsers);

    // send active users
    io.emit("getUsers", onlineUsers);
  });

  // add message
  socket.on("sendMessage", (message) => {
    const user = onlineUsers.find(
      (user) => user.userId === message.recipientId
    );

    if (user) {
      console.log("sending message and notification");
      io.to(user.socketId).emit("getMessage", message);
      io.to(user.socketId).emit("getNotification", {
        senderId: message.senderId,
        isRead: false,
        date: new Date(),
      });
    }
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);
    console.log("User Disconnected:", onlineUsers);

    // send active users
    io.emit("getUsers", onlineUsers);
  });
});




