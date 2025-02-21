import express from "express";
import path from "path";
import { Server } from "socket.io";
import http from "http";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

import env from "dotenv";

env.config();

const app = express();
const server = http.createServer(app);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, "views")));

const io = new Server(server);
const users = new Map(); // Store online users

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

// Define Chat Schema
const chatSchema = new mongoose.Schema({
    sender: String,
    receiver: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
});
const Chat = mongoose.model("Chat", chatSchema);

io.on("connection", (socket) => {
    // When a user sets their name
    socket.on("set-name", (name) => {
        users.set(socket.id, { name, pairedWith: null });
        updateUserList();
    });

    // When a user chooses a chat partner, load old messages
    socket.on("choose-partner", async (partnerId) => {
        if (!users.has(partnerId) || partnerId === socket.id) return;

        // Get user names
        const userName = users.get(socket.id).name;
        const partnerName = users.get(partnerId).name;

        // Update pairing
        users.get(socket.id).pairedWith = partnerId;
        // users.get(partnerId).pairedWith = socket.id;

        // Fetch previous messages from MongoDB
        const chatHistory = await Chat.find({
            $or: [
                { sender: userName, receiver: partnerName },
                { sender: partnerName, receiver: userName },
            ],
        }).sort({ timestamp: 1 });

        if (chatHistory) {
            // Send previous messages to the user
            io.to(socket.id).emit("load-chat-history", { partnerId, partnerName, chatHistory });
        }

        io.to(socket.id).emit("paired", { partnerId, partnerName });
        io.to(partnerId).emit("paired", { partnerId: socket.id, partnerName: userName });
    });

    // When a user sends a message, save it in MongoDB
    socket.on("send-message", async ({ message, to }) => {
        if (!users.has(to)) return;

        const senderName = users.get(socket.id).name;
        const receiverName = users.get(to).name;

        // Save to database
        const newChat = new Chat({ sender: senderName, receiver: receiverName, message });
        await newChat.save();

        // Send the message to the receiver
        io.to(to).emit("send-message", { data: { message, from: socket.id } });
    });

    // When a user disconnects
    socket.on("disconnect", () => {
        users.delete(socket.id);
        updateUserList();
    });

    // Update all users with the user list
    function updateUserList() {
        const userList = [...users].map(([id, { name }]) => ({ id, name }));
        io.emit("user-list", userList);
    }
});

server.listen(8080, () => console.log("Server is ON"));










// import express from "express";
// import path from "path";
// import { Server } from "socket.io";
// import http from "http";
// import { fileURLToPath } from "url";

// const app = express();
// const server = http.createServer(app);
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// const io = new Server(server);
// const users = new Map(); // Store connected users

// io.on("connection", (socket) => {
//     console.log(`User connected: ${socket.id}`);

//     // When a user sets their name
//     socket.on("set-name", (name) => {
//         users.set(socket.id, { name, pairedWith: null });
//         updateUserList();
//     });

//     socket.on("send-message", ({ message, to }) => {
//         if (users.has(to)) {
//             io.to(to).emit("send-message", { data: { message, from: socket.id } });
//         }
//     });

//     // When a user chooses a chat partner
//     socket.on("choose-partner", (partnerId) => {
//         if (!users.has(partnerId) || partnerId === socket.id) return; // Prevent errors

//         // Get user names
//         const userName = users.get(socket.id).name;
//         const partnerName = users.get(partnerId).name;

//         // Update pairing
//         users.get(socket.id).pairedWith = partnerId;
//         users.get(partnerId).pairedWith = socket.id;

//         // Notify both users
//         io.to(socket.id).emit("paired", { partnerId, partnerName });
//         io.to(partnerId).emit("paired", { partnerId: socket.id, partnerName: userName });
//     });

//     // When a user disconnects
//     socket.on("disconnect", () => {
//         console.log(`User disconnected: ${socket.id}`);
//         if (users.has(socket.id)) {
//             let pairedUser = users.get(socket.id).pairedWith;
//             if (pairedUser && users.has(pairedUser)) {
//                 io.to(pairedUser).emit("user-disconnected");
//                 users.get(pairedUser).pairedWith = null;
//             }
//         }
//         users.delete(socket.id);
//         updateUserList();
//     });

//     // Update all users with the current user list
//     function updateUserList() {
//         const userList = [...users].map(([id, { name }]) => ({ id, name }));
//         io.emit("user-list", userList);
//     }
// });

// app.use(express.static(path.join(__dirname, "views")));

// server.listen(3000, () => console.log("Server is ON"));