const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cards = require("./data/cards");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;


// ==========================================
// SALONS
// ==========================================

const rooms = {};

app.use(express.static(path.join(__dirname)));


// ==========================================
// SOCKET.IO
// ==========================================

io.on("connection", (socket) => {

    console.log("🟢 Joueur connecté :", socket.id);


    // ======================================
    // CRÉER UN SALON
    // ======================================

    socket.on("createRoom", ({ pseudo }) => {

        // Vérification du pseudo
        if (!pseudo || !pseudo.trim()) {

            socket.emit(
                "roomError",
                "Pseudo invalide."
            );

            return;
        }


        const roomCode = generateRoomCode();


        rooms[roomCode] = {

            host: socket.id,

            players: [
                {
                    id: socket.id,
                    pseudo: pseudo.trim()
                }
            ],

            settings: {

                themes: [
                    "anime",
                    "films",
                    "series",
                    "jeux",
                    "superheros",
                    "celebrites"
                ],

                difficulty: "normal"
            }
        };


        socket.join(roomCode);


        const room = rooms[roomCode];


        // Réponse au créateur
        socket.emit("roomCreated", {

            roomCode,

            players: room.players,

            host: room.host,

            settings: room.settings
        });


        console.log(
            `🎮 Salon ${roomCode} créé par ${pseudo}`
        );
    });



    // ======================================
    // REJOINDRE UN SALON
    // ======================================

    socket.on("joinRoom", ({ pseudo, roomCode }) => {

        if (!pseudo || !pseudo.trim()) {

            socket.emit(
                "roomError",
                "Pseudo invalide."
            );

            return;
        }


        if (!roomCode) {

            socket.emit(
                "roomError",
                "Code du salon invalide."
            );

            return;
        }


        roomCode =
            roomCode
                .trim()
                .toUpperCase();


        const room = rooms[roomCode];


        // Salon inexistant
        if (!room) {

            socket.emit(
                "roomError",
                "Ce salon n'existe pas."
            );

            return;
        }


        // Maximum 8 joueurs
        if (room.players.length >= 8) {

            socket.emit(
                "roomError",
                "Ce salon est complet."
            );

            return;
        }


        // Pseudo déjà utilisé
        const pseudoAlreadyUsed =
            room.players.some(
                player =>
                    player.pseudo.toLowerCase() ===
                    pseudo.trim().toLowerCase()
            );


        if (pseudoAlreadyUsed) {

            socket.emit(
                "roomError",
                "Ce pseudo est déjà utilisé dans le salon."
            );

            return;
        }


        // Ajout du joueur
        room.players.push({

            id: socket.id,

            pseudo: pseudo.trim()
        });


        socket.join(roomCode);


        // Confirmation au joueur
        socket.emit("roomJoined", {

            roomCode,

            settings: room.settings
        });


        // Mise à jour pour tout le monde
        io.to(roomCode).emit("roomUpdated", {

            roomCode,

            players: room.players,

            host: room.host,

            settings: room.settings
        });


        console.log(
            `👤 ${pseudo} rejoint ${roomCode}`
        );
    });



    // ======================================
    // RÉCUPÉRER LES INFOS DU SALON
    // ======================================

    socket.on("getRoom", ({ roomCode }) => {

        if (!roomCode) {
            return;
        }


        roomCode =
            roomCode
                .trim()
                .toUpperCase();


        const room = rooms[roomCode];


        if (!room) {

            socket.emit(
                "roomError",
                "Ce salon n'existe plus."
            );

            return;
        }


        socket.emit("roomData", {

            roomCode,

            players: room.players,

            host: room.host,

            settings: room.settings
        });
    });



    // ======================================
    // MODIFIER LES PARAMÈTRES
    // ======================================

    socket.on(
        "updateSettings",
        ({ roomCode, settings }) => {

            if (!roomCode) {
                return;
            }


            roomCode =
                roomCode
                    .trim()
                    .toUpperCase();


            const room =
                rooms[roomCode];


            if (!room) {
                return;
            }


            // Seul le chef peut modifier
            if (room.host !== socket.id) {

                console.log(
                    `⛔ ${socket.id} a tenté de modifier ${roomCode}`
                );

                return;
            }


            // Vérification des thèmes
            if (
                settings.themes &&
                Array.isArray(settings.themes) &&
                settings.themes.length > 0
            ) {

                room.settings.themes =
                    settings.themes;
            }


            // Vérification difficulté
            const difficulties = [
                "facile",
                "normal",
                "difficile"
            ];


            if (
                settings.difficulty &&
                difficulties.includes(
                    settings.difficulty
                )
            ) {

                room.settings.difficulty =
                    settings.difficulty;
            }


            // Synchronisation avec tous
            io.to(roomCode).emit(
                "settingsUpdated",
                {
                    settings:
                        room.settings
                }
            );


            console.log(
                `⚙️ Paramètres ${roomCode} :`,
                room.settings
            );
        }
    );



    // ======================================
    // QUITTER VOLONTAIREMENT LE SALON
    // ======================================

    socket.on("leaveRoom", ({ roomCode }) => {

        if (!roomCode) {
            return;
        }


        roomCode =
            roomCode
                .trim()
                .toUpperCase();


        removePlayerFromRoom(
            socket,
            roomCode
        );


        socket.leave(roomCode);
    });



    // ======================================
    // DÉCONNEXION
    // ======================================

    socket.on("disconnect", () => {

        console.log(
            "🔴 Joueur déconnecté :",
            socket.id
        );


        for (const roomCode of Object.keys(rooms)) {

            const room =
                rooms[roomCode];


            const playerExists =
                room.players.some(
                    player =>
                        player.id === socket.id
                );


            if (!playerExists) {
                continue;
            }


            removePlayerFromRoom(
                socket,
                roomCode
            );
        }
    });

});



// ==========================================
// RETIRER UN JOUEUR
// ==========================================

function removePlayerFromRoom(
    socket,
    roomCode
) {

    const room =
        rooms[roomCode];


    if (!room) {
        return;
    }


    const playerIndex =
        room.players.findIndex(
            player =>
                player.id === socket.id
        );


    if (playerIndex === -1) {
        return;
    }


    const player =
        room.players[playerIndex];


    room.players.splice(
        playerIndex,
        1
    );


    console.log(
        `👋 ${player.pseudo} quitte ${roomCode}`
    );


    // Plus aucun joueur
    if (room.players.length === 0) {

        delete rooms[roomCode];


        console.log(
            `🗑️ Salon ${roomCode} supprimé`
        );


        return;
    }


    // Le chef est parti
    if (room.host === socket.id) {

        room.host =
            room.players[0].id;


        console.log(
            `👑 ${room.players[0].pseudo} devient chef de ${roomCode}`
        );
    }


    // Synchronisation
    io.to(roomCode).emit(
        "roomUpdated",
        {

            roomCode,

            players:
                room.players,

            host:
                room.host,

            settings:
                room.settings
        }
    );
}



// ==========================================
// GÉNÉRATION CODE SALON
// ==========================================

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";


    let code;


    do {

        code = "";


        for (
            let i = 0;
            i < 5;
            i++
        ) {

            const randomIndex =
                Math.floor(
                    Math.random() *
                    characters.length
                );


            code +=
                characters[
                    randomIndex
                ];
        }

    } while (rooms[code]);


    return code;
}



// ==========================================
// DÉMARRAGE
// ==========================================
console.log(`🃏 ${cards.length} cartes chargées`);
server.listen(PORT, () => {

    console.log("");
    console.log("🎭 UNDERCOVER");
    console.log(
        `🚀 Serveur lancé sur http://localhost:${PORT}`
    );
    console.log("");

});