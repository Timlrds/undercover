import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

function Home() {

    const navigate = useNavigate();

    const [pseudo, setPseudo] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState("");


    // ============================
    // RÉPONSES DU SERVEUR
    // ============================

    useEffect(() => {

        function handleRoomCreated(data) {

            sessionStorage.setItem(
                "pseudo",
                pseudo.trim()
            );

            sessionStorage.setItem(
                "roomCode",
                data.roomCode
            );

            navigate(
                `/lobby/${data.roomCode}`
            );
        }


        function handleRoomJoined(data) {

            sessionStorage.setItem(
                "pseudo",
                pseudo.trim()
            );

            sessionStorage.setItem(
                "roomCode",
                data.roomCode
            );

            navigate(
                `/lobby/${data.roomCode}`
            );
        }


        function handleRoomError(message) {
            setError(message);
        }


        socket.on(
            "roomCreated",
            handleRoomCreated
        );

        socket.on(
            "roomJoined",
            handleRoomJoined
        );

        socket.on(
            "roomError",
            handleRoomError
        );


        return () => {

            socket.off(
                "roomCreated",
                handleRoomCreated
            );

            socket.off(
                "roomJoined",
                handleRoomJoined
            );

            socket.off(
                "roomError",
                handleRoomError
            );
        };

    }, [navigate, pseudo]);


    // ============================
    // CRÉER
    // ============================

    function createRoom() {

        if (!pseudo.trim()) {

            setError(
                "Entre ton pseudo."
            );

            return;
        }

        setError("");

        socket.emit(
            "createRoom",
            {
                pseudo: pseudo.trim()
            }
        );
    }


    // ============================
    // REJOINDRE
    // ============================

    function joinRoom() {

        if (!pseudo.trim()) {

            setError(
                "Entre ton pseudo."
            );

            return;
        }


        if (roomCode.length !== 5) {

            setError(
                "Entre un code valide."
            );

            return;
        }


        setError("");


        socket.emit(
            "joinRoom",
            {
                pseudo: pseudo.trim(),
                roomCode: roomCode
            }
        );
    }


    return (
        <main className="home-page">

            <header className="header">

                <div className="logo-icon">
                    ?
                </div>

                <h1>UNDERCOVER</h1>

                <p>
                    Tout le monde connaît le personnage.
                    <br />
                    Sauf l'un d'entre vous.
                </p>

            </header>


            <section className="game-card">

                <div className="field">

                    <label>
                        TON PSEUDO
                    </label>

                    <input
                        type="text"
                        placeholder="Entre ton pseudo"
                        maxLength="16"
                        value={pseudo}

                        onChange={(event) => {

                            setPseudo(
                                event.target.value
                            );

                            setError("");
                        }}
                    />

                </div>


                <button
                    className="btn btn-primary"
                    onClick={createRoom}
                >

                    <span className="btn-icon">
                        +
                    </span>

                    <span>
                        <strong>
                            Créer un salon
                        </strong>

                        <small>
                            Invite tes amis
                        </small>
                    </span>

                </button>


                <div className="separator">
                    <span>OU</span>
                </div>


                <div className="field">

                    <label>
                        CODE DU SALON
                    </label>

                    <input
                        className="code-input"
                        type="text"
                        placeholder="ABCDE"
                        maxLength="5"
                        value={roomCode}

                        onChange={(event) => {

                            const value =
                                event.target.value
                                    .toUpperCase()
                                    .replace(
                                        /[^A-Z0-9]/g,
                                        ""
                                    );

                            setRoomCode(value);
                            setError("");
                        }}
                    />

                </div>


                <button
                    className="btn btn-secondary"
                    onClick={joinRoom}
                >

                    <span className="btn-icon">
                        →
                    </span>

                    <span>
                        <strong>
                            Rejoindre
                        </strong>

                        <small>
                            Entre dans la partie
                        </small>
                    </span>

                </button>


                {error && (

                    <div className="home-error">
                        {error}
                    </div>

                )}

            </section>

        </main>
    );
}

export default Home;