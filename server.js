const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// Les salons seront stockés ici
const rooms = {};

// Permet d'afficher index.html, style.css, script.js...
app.use(express.static(path.join(__dirname)));


// ==============================
// CONNEXIONS
// ==============================

io.on("connection", (socket) => {

    console.log("🟢 Joueur connecté :", socket.id);


    // CRÉATION D'UN SALON
    socket.on("createRoom", ({ pseudo }) => {

        const roomCode = generateRoomCode();

        rooms[roomCode] = {
            host: socket.id,
            players: [
                {
                    id: socket.id,
                    pseudo: pseudo
                }
            ]
        };

        socket.join(roomCode);

        socket.emit("roomCreated", {
            roomCode: roomCode,
            players: rooms[roomCode].players,
            host: socket.id
        });

        console.log(
            `🎮 Salon ${roomCode} créé par ${pseudo}`
        );
    });


    // REJOINDRE UN SALON
    socket.on("joinRoom", ({ pseudo, roomCode }) => {

        roomCode = roomCode.toUpperCase();

        const room = rooms[roomCode];

        if (!room) {
            socket.emit(
                "roomError",
                "Ce salon n'existe pas."
            );

            return;
        }

        room.players.push({
            id: socket.id,
            pseudo: pseudo
        });

        socket.join(roomCode);

        io.to(roomCode).emit("roomUpdated", {
            roomCode: roomCode,
            players: room.players,
            host: room.host
        });

        console.log(
            `👤 ${pseudo} rejoint ${roomCode}`
        );
    });


    // DÉCONNEXION
    socket.on("disconnect", () => {

        console.log(
            "🔴 Joueur déconnecté :",
            socket.id
        );

        for (const roomCode in rooms) {

            const room = rooms[roomCode];

            const playerIndex =
                room.players.findIndex(
                    player => player.id === socket.id
                );

            if (playerIndex === -1) {
                continue;
            }

            room.players.splice(playerIndex, 1);


            // Plus personne = suppression du salon
            if (room.players.length === 0) {

                delete rooms[roomCode];

                console.log(
                    `🗑️ Salon ${roomCode} supprimé`
                );

                continue;
            }


            // Si l'hôte part, on change d'hôte
            if (room.host === socket.id) {
                room.host = room.players[0].id;
            }


            io.to(roomCode).emit("roomUpdated", {
                roomCode: roomCode,
                players: room.players,
                host: room.host
            });
        }
    });
});


// ==============================
// GÉNÉRATION DU CODE
// ==============================

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code;

    do {

        code = "";

        for (let i = 0; i < 5; i++) {

            const randomIndex =
                Math.floor(
                    Math.random() * characters.length
                );

            code += characters[randomIndex];
        }

    } while (rooms[code]);

    return code;
}


// ==============================
// DÉMARRAGE DU SERVEUR
// ==============================

server.listen(PORT, () => {

    console.log("");
    console.log("🎭 UNDERCOVER");
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    console.log("");

});