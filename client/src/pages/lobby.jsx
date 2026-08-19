import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import { socket } from "../socket";


function Lobby() {

    const { code } = useParams();

    const navigate = useNavigate();

    const [players, setPlayers] =
        useState([]);

    const [hostId, setHostId] =
        useState(null);

    const [error, setError] =
        useState("");

    const maxPlayers = 8;


    // ==============================
    // SOCKET.IO
    // ==============================

    useEffect(() => {

    // ==============================
    // MISE À JOUR DU SALON
    // ==============================

    function updateRoom(data) {

        setPlayers(
            data.players || []
        );

        setHostId(
            data.host
        );

        // Récupère aussi les paramètres
        if (data.settings) {
            setSettings(data.settings);
        }
    }


    // ==============================
    // ERREUR SALON
    // ==============================

    function roomError(message) {
        setError(message);
    }


    // ==============================
    // PARTIE LANCÉE
    // ==============================

    function handleGameStarted(data) {

        // On stocke uniquement le mot reçu
        sessionStorage.setItem(
            "gameWord",
            data.word
        );

        // Direction page de jeu
        navigate(
            `/game/${data.roomCode}`
        );
    }


    // ==============================
    // ERREUR LANCEMENT
    // ==============================

    function handleGameError(message) {

        setError(message);

        setTimeout(() => {
            setError("");
        }, 3000);
    }


    // ==============================
    // ÉCOUTE SOCKET
    // ==============================

    socket.on(
        "roomData",
        updateRoom
    );

    socket.on(
        "roomUpdated",
        updateRoom
    );

    socket.on(
        "roomError",
        roomError
    );

    socket.on(
        "gameStarted",
        handleGameStarted
    );

    socket.on(
        "gameError",
        handleGameError
    );


    // ==============================
    // DEMANDE LES INFOS DU SALON
    // ==============================

    socket.emit(
        "getRoom",
        {
            roomCode: code
        }
    );


    // ==============================
    // NETTOYAGE
    // ==============================

    return () => {

        socket.off(
            "roomData",
            updateRoom
        );

        socket.off(
            "roomUpdated",
            updateRoom
        );

        socket.off(
            "roomError",
            roomError
        );

        socket.off(
            "gameStarted",
            handleGameStarted
        );

        socket.off(
            "gameError",
            handleGameError
        );
    };

}, [code, navigate]);


    // ==============================
    // JOUEURS
    // ==============================

    const host =
        players.find(
            player =>
                player.id === hostId
        );


    const otherPlayers =
        players.filter(
            player =>
                player.id !== hostId
        );


    const isHost =
        socket.id === hostId;


    // ==============================
    // COPIER CODE
    // ==============================

    async function copyCode() {

        try {

            await navigator.clipboard
                .writeText(code);

        } catch {

            console.log(
                "Impossible de copier"
            );
        }
    }


    // ==============================
    // QUITTER
    // ==============================

    function leaveLobby() {

        navigate("/");
    }


    // ==============================
    // LANCER
    // ==============================

    function startGame() {

    if (!isHost) {
        return;
    }

    socket.emit(
        "startGame",
        {
            roomCode: code
        }
    );
}


    // ==============================
    // ERREUR
    // ==============================

    if (error) {

        return (

            <main className="home-page">

                <section className="game-card">

                    <h2>
                        Salon introuvable
                    </h2>

                    <p
                        style={{
                            marginTop: "10px",
                            color: "#888895"
                        }}
                    >
                        {error}
                    </p>

                    <button
                        className="btn btn-primary"
                        style={{
                            marginTop: "20px"
                        }}
                        onClick={() =>
                            navigate("/")
                        }
                    >
                        Retour à l'accueil
                    </button>

                </section>

            </main>
        );
    }


    return (

        <main className="video-lobby">


            {/* ================= HEADER ================= */}


            <header className="lobby-topbar">

                <button
                    className="lobby-leave"
                    onClick={leaveLobby}
                >
                    ← Quitter
                </button>


                <div className="lobby-brand">

                    <div className="mini-logo">
                        ?
                    </div>

                    <div>

                        <strong>
                            UNDERCOVER
                        </strong>

                        <span>
                            LOBBY
                        </span>

                    </div>

                </div>


                <div className="lobby-room-info">

                    <span>
                        CODE DU SALON
                    </span>

                    <button
                        className="room-code-button"
                        onClick={copyCode}
                    >

                        {code}

                        <span>
                            ⧉
                        </span>

                    </button>

                </div>

            </header>


            {/* ================= JOUEURS ================= */}


            <section className="lobby-stage">

                <div className="players-stage">


                    <PlayerSlot
                        player={
                            otherPlayers[0]
                        }
                        position="slot-left-top"
                    />


                    <PlayerSlot
                        player={
                            otherPlayers[2]
                        }
                        position="slot-left-bottom"
                    />


                    {/* HÔTE */}

                    <div className="host-position">

                        <div className="host-badge">
                            ★ CHEF DU SALON
                        </div>


                        <div className="host-avatar">

                            <div className="host-avatar-inner">

                                {
                                    host
                                        ? host.pseudo
                                            .charAt(0)
                                            .toUpperCase()

                                        : "?"
                                }

                            </div>

                        </div>


                        <div className="host-platform">
                        </div>


                        <div className="host-name">

                            {
                                host?.pseudo ||
                                "Connexion..."
                            }

                        </div>


                        <div className="ready-status">
                            PRÊT
                        </div>

                    </div>


                    <PlayerSlot
                        player={
                            otherPlayers[1]
                        }
                        position="slot-right-top"
                    />


                    <PlayerSlot
                        player={
                            otherPlayers[3]
                        }
                        position="slot-right-bottom"
                    />


                    <PlayerSlot
                        player={
                            otherPlayers[4]
                        }
                        position="slot-far-left"
                    />


                    <PlayerSlot
                        player={
                            otherPlayers[5]
                        }
                        position="slot-far-right"
                    />


                    <PlayerSlot
                        player={
                            otherPlayers[6]
                        }
                        position="slot-back"
                    />

                </div>

            </section>


            {/* ================= FOOTER ================= */}


            <footer className="lobby-bottom">


                <div className="lobby-player-count">

                    <div className="online-dot">
                    </div>

                    <span>

                        <strong>
                            {players.length}
                        </strong>

                        {" "}/ {maxPlayers} joueurs

                    </span>

                </div>


                <div className="lobby-message">

                    <span>
                        MODE
                    </span>

                    <strong>
                        Culture générale
                    </strong>

                    <small>
                        Personnages & célébrités
                    </small>

                </div>


                <div className="lobby-actions">

                    {isHost && (

                        <>
                            <button className="settings-button">
                                ⚙
                            </button>


                            <button
                                className="launch-button"
                                onClick={startGame}
                            >

                                <span>
                                    ▶
                                </span>

                                <div>

                                    <strong>
                                        LANCER
                                    </strong>

                                    <small>
                                        LA PARTIE
                                    </small>

                                </div>

                            </button>
                        </>

                    )}


                    {!isHost && (

                        <div className="waiting-host">
                            En attente du chef...
                        </div>

                    )}

                </div>

            </footer>

        </main>
    );
}


// ========================================
// EMPLACEMENT JOUEUR
// ========================================

function PlayerSlot({
    player,
    position
}) {

    if (!player) {

        return (

            <div
                className={
                    `player-slot empty-slot ${position}`
                }
            >

                <div className="empty-player-circle">
                    +
                </div>

                <div className="empty-platform">
                </div>

                <span className="waiting-player">
                    EN ATTENTE
                </span>

            </div>

        );
    }


    return (

        <div
            className={
                `player-slot ${position}`
            }
        >

            <div className="player-avatar-large">

                {
                    player.pseudo
                        .charAt(0)
                        .toUpperCase()
                }

            </div>


            <div className="player-platform">
            </div>


            <strong className="stage-player-name">

                {player.pseudo}

            </strong>


            <span className="player-ready">
                PRÊT
            </span>

        </div>

    );
}


export default Lobby;