const socket = window.io();

const chatTitle = document.querySelector("#chat");
const messagesContainer = document.getElementById("messages-container");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message");
const nameForm = document.querySelector("#name-form");
const nameInput = document.querySelector("#name");
const userListContainer = document.querySelector("#user-list");

let myName = "";
let partnerId = "";
let partnerName = "";

// Ask for the user's name
nameForm.addEventListener("submit", (event) => {
    event.preventDefault();
    myName = nameInput.value.trim();
    if (!myName) return;

    socket.emit("set-name", myName);
    nameForm.style.display = "none";
    chatTitle.innerHTML = `Waiting for a connection...`;
});

// Receive and display the user list
socket.on("user-list", (users) => {
    userListContainer.innerHTML = "";
    users.forEach(user => {
        if (user.id !== socket.id) {
            const userElement = document.createElement("button");
            userElement.textContent = user.name;
            userElement.classList.add("user-button");
            userElement.onclick = () => chooseChatPartner(user.id, user.name);
            userListContainer.appendChild(userElement);
        }
    });
});

// Handle choosing a chat partner
function chooseChatPartner(id, name) {
    socket.emit("choose-partner", id);
}

// Handle choosing a chat partner
socket.on("paired", ({ partnerId: id, partnerName: name }) => {
    partnerId = id;
    partnerName = name;
    chatTitle.innerHTML = `Chatting with ${partnerName}`;
    messagesContainer.innerHTML = ""; // Clear chat history
});

// Load previous chat history when switching chats
socket.on("load-chat-history", ({ partnerId: id, partnerName: name, chatHistory }) => {
    partnerId = id;
    partnerName = name;
    chatTitle.innerHTML = `Chatting with ${partnerName}`;
    messagesContainer.innerHTML = ""; // Clear previous messages

    // Load old messages
    chatHistory.forEach(({ sender, message }) => {
        const type = sender === myName ? "sent" : "received";
        // appendMessage(message, type);
        appendMessage(message, type, sender);
    });
});

// Handle sending messages
messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = messageInput.value.trim();
    if (!message || !partnerId) return;

    // appendMessage(`You: ${message}`, "sent");
    appendMessage(message, "sent", myName); // Include sender's name
    socket.emit("send-message", { message, to: partnerId });
    messageInput.value = "";
});

// Handle receiving messages
socket.on("send-message", ({ data: { message, from } }) => {
    if (from === partnerId) {
        // appendMessage(`${partnerName}: ${message}`, "received");
        appendMessage(message, "received", partnerName); // Include sender's name
    }
});

// Append messages to chat
function appendMessage(message, type, senderName = "") {
    const msgElement = document.createElement("p");
    msgElement.textContent = message;

    msgElement.classList.add("message", type);
    messagesContainer.appendChild(msgElement);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}






// const socket = window.io();
// const chatTitle = document.querySelector("#chat");
// const messagesContainer = document.querySelector("#messages-container");
// const messageForm = document.querySelector("#message-form");
// const messageInput = document.querySelector("#message");
// const nameForm = document.querySelector("#name-form");
// const nameInput = document.querySelector("#name");
// const userListContainer = document.querySelector("#user-list");

// let myName = "";
// let partnerId = "";
// let partnerName = "";

// // Step 1: Ask for the user's name
// nameForm.addEventListener("submit", (event) => {
//     event.preventDefault();
//     myName = nameInput.value.trim();
//     if (!myName) return;

//     socket.emit("set-name", myName);
//     nameForm.style.display = "none"; // Hide name input
//     chatTitle.innerHTML = `Waiting for a connection...`;
// });

// // Step 2: Receive and display the user list
// socket.on("user-list", (users) => {
//     userListContainer.innerHTML = ""; // Clear list
//     users.forEach(user => {
//         if (user.id !== socket.id) { // Don't show yourself
//             const userElement = document.createElement("button");
//             userElement.textContent = user.name;
//             userElement.classList.add("user-button");
//             userElement.onclick = () => chooseChatPartner(user.id, user.name);
//             userListContainer.appendChild(userElement);
//         }
//     });
// });

// // Step 3: Handle choosing a chat partner
// function chooseChatPartner(id, name) {
//     socket.emit("choose-partner", id);
// }

// // Step 4: When paired with someone
// socket.on("paired", ({ partnerId: id, partnerName: name }) => {
//     partnerId = id;
//     partnerName = name;
//     chatTitle.innerHTML = `Chatting with ${partnerName}`;
//     messagesContainer.innerHTML = ""; // Clear chat history
// });

// // Step 5: Handle sending messages
// messageForm.addEventListener("submit", (event) => {
//     event.preventDefault();
//     const message = messageInput.value.trim();
//     if (!message || !partnerId) return;

//     appendMessage(`You: ${message}`, "sent");
//     socket.emit("send-message", { message, to: partnerId });
//     messageInput.value = "";
// });

// // Step 6: Handle receiving messages
// socket.on("send-message", ({ data: { message, from } }) => {
//     if (from === partnerId) {
//         appendMessage(`${partnerName}:${message}`, "received");
//     }
// });


// // Step 7: Append messages to chat
// function appendMessage(message, type) {
//     const msgElement = document.createElement("p");
//     msgElement.textContent = message;
//     msgElement.classList.add("message", type);
//     messagesContainer.appendChild(msgElement);
//     messagesContainer.scrollTop = messagesContainer.scrollHeight;
// }

// // Step 8: Handle partner disconnection
// socket.on("user-disconnected", () => {
//     chatTitle.innerHTML = `Your partner disconnected. Choose another user.`;
//     partnerId = "";
//     partnerName = "";
// });