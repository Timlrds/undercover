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
// LANCER UNE PARTIE
// ======================================

socket.on("startGame", ({ roomCode }) => {

    if (!roomCode) {
        return;
    }

    roomCode = roomCode
        .trim()
        .toUpperCase();

    const room = rooms[roomCode];


    // ==============================
    // SALON EXISTANT ?
    // ==============================

    if (!room) {

        socket.emit(
            "gameError",
            "Ce salon n'existe plus."
        );

        return;
    }


    // ==============================
    // SEUL LE CHEF PEUT LANCER
    // ==============================

    if (room.host !== socket.id) {

        socket.emit(
            "gameError",
            "Seul le chef peut lancer la partie."
        );

        return;
    }


    // ==============================
    // MINIMUM 3 JOUEURS
    // ==============================

    if (room.players.length < 3) {

        socket.emit(
            "gameError",
            "Il faut au moins 3 joueurs pour commencer."
        );

        return;
    }


    // ==============================
    // CARTES DISPONIBLES
    // ==============================

    const availableCards = cards.filter((card) => {

        return room.settings.themes.includes(
            card.theme
        );

    });


    if (availableCards.length === 0) {

        socket.emit(
            "gameError",
            "Aucune carte disponible avec ces thèmes."
        );

        return;
    }


    // ==============================
    // CHOISIR UNE CARTE
    // ==============================

    const selectedCard =
        availableCards[
            Math.floor(
                Math.random() *
                availableCards.length
            )
        ];


    // ==============================
    // CHOISIR L'UNDERCOVER
    // ==============================

    const undercover =
        room.players[
            Math.floor(
                Math.random() *
                room.players.length
            )
        ];


    // ==============================
    // CHOISIR L'INDICE
    // ==============================

    const difficulty =
        room.settings.difficulty || "normal";


    const clue =
        selectedCard.clues?.[difficulty]
        ?? selectedCard.clue;


    if (!clue) {

        socket.emit(
            "gameError",
            "Cette carte ne possède pas d'indice valide."
        );

        return;
    }


    // Compatible avec l'ancien "character"
    // et notre futur système "answer".

    const answer =
        selectedCard.answer ??
        selectedCard.character;


    // ==============================
    // STOCKER LA PARTIE
    // ==============================

    room.game = {
    status: "reveal",

    answer: answer,
    clue: clue,
    theme: selectedCard.theme,

    undercoverId: undercover.id,

    readyPlayers: [],

    speakingOrder: [],

    currentRound: 0,
    currentSpeakerIndex: 0,

    startedAt: Date.now()
};


    console.log("");
    console.log(`🎲 PARTIE ${roomCode}`);
    console.log(`🎴 Réponse : ${answer}`);
    console.log(`💡 Indice : ${clue}`);
    console.log(`🕵️ Undercover : ${undercover.pseudo}`);
    console.log("");


    // ==============================
    // ENVOI INDIVIDUEL
    // ==============================

    room.players.forEach((player) => {

        const isUndercover =
            player.id === undercover.id;


        // IMPORTANT :
        // chaque joueur reçoit seulement
        // SON propre mot.

        io.to(player.id).emit(
            "gameStarted",
            {
                roomCode: roomCode,

                word: isUndercover
                    ? clue
                    : answer
            }
        );

    });

});


// ======================================
// JOUEUR PRÊT APRÈS AVOIR VU SON MOT
// ======================================

socket.on("playerReady", ({ roomCode }) => {

    if (!roomCode) {
        return;
    }

    roomCode = roomCode
        .trim()
        .toUpperCase();

    const room = rooms[roomCode];

    if (!room || !room.game) {
        return;
    }


    // Vérifie que le joueur appartient au salon
    const player = room.players.find(
        player => player.id === socket.id
    );

    if (!player) {
        return;
    }


    // Évite de compter deux fois le même joueur
    if (!room.game.readyPlayers.includes(socket.id)) {

        room.game.readyPlayers.push(socket.id);
    }


    // Envoie le compteur à tout le monde
    io.to(roomCode).emit("readyUpdated", {

        readyCount:
            room.game.readyPlayers.length,

        totalPlayers:
            room.players.length
    });


    console.log(
        `✅ ${player.pseudo} est prêt ` +
        `(${room.game.readyPlayers.length}/${room.players.length})`
    );


    // Tout le monde n'est pas encore prêt
    if (
        room.game.readyPlayers.length !==
        room.players.length
    ) {
        return;
    }


    // ==================================
    // TOUT LE MONDE EST PRÊT
    // ==================================

    // Copie des joueurs
    const speakingOrder = [
        ...room.players
    ];


    // Mélange aléatoire
    for (
        let i = speakingOrder.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            speakingOrder[i],
            speakingOrder[j]
        ] = [
            speakingOrder[j],
            speakingOrder[i]
        ];
    }


    // On ne stocke que les IDs
    room.game.speakingOrder =
        speakingOrder.map(
            player => player.id
        );


    room.game.status = "discussion";

    room.game.currentRound = 1;

    room.game.currentSpeakerIndex = 0;


    const firstPlayer =
        speakingOrder[0];


    console.log("");
    console.log(
        `🗣️ Discussion ${roomCode}`
    );

    console.log(
        "Ordre :",
        speakingOrder
            .map(player => player.pseudo)
            .join(" → ")
    );

    console.log("Tour : 1/3");

    console.log(
        `Premier joueur : ${firstPlayer.pseudo}`
    );

    console.log("");


    // IMPORTANT :
    // aucune information sur les mots
    // ou l'Undercover n'est envoyée.

    io.to(roomCode).emit(
        "discussionStarted",
        {

            round: 1,

            maxInitialRounds: 3,

            speakingOrder:
                speakingOrder.map(
                    player => ({
                        id: player.id,
                        pseudo: player.pseudo
                    })
                ),

            currentSpeakerId:
                firstPlayer.id
        }
    );

});



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