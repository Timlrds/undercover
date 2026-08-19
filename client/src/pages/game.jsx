import {
    useEffect,
    useState
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import { socket } from "../socket";


function Game() {

    const { code } = useParams();

    const navigate = useNavigate();


    const [revealed, setRevealed] =
        useState(false);

    const [ready, setReady] =
        useState(false);

    const [readyCount, setReadyCount] =
        useState(0);

    const [totalPlayers, setTotalPlayers] =
        useState(0);


    const word =
        sessionStorage.getItem("gameWord");


    function revealWord() {

    if (ready) {
        return;
    }

    setRevealed(true);
}


    function hideWord() {
        setRevealed(false);
    }

    function confirmReady() {

    if (ready) {
        return;
    }

    setRevealed(false);

    setReady(true);

    socket.emit(
        "playerReady",
        {
            roomCode: code
        }
    );
}

useEffect(() => {

    function handleReadyUpdated(data) {

        setReadyCount(
            data.readyCount
        );

        setTotalPlayers(
            data.totalPlayers
        );
    }


    function handleDiscussionStarted(data) {

        sessionStorage.setItem(
            "discussionData",
            JSON.stringify(data)
        );

        navigate(
            `/discussion/${code}`
        );
    }


    socket.on(
        "readyUpdated",
        handleReadyUpdated
    );

    socket.on(
        "discussionStarted",
        handleDiscussionStarted
    );


    return () => {

        socket.off(
            "readyUpdated",
            handleReadyUpdated
        );

        socket.off(
            "discussionStarted",
            handleDiscussionStarted
        );
    };

}, [code, navigate]);

    return (

        <main className="game-page">

            <div className="game-background game-glow-1"></div>
            <div className="game-background game-glow-2"></div>


            {/* HEADER */}

            <header className="game-header">

                <div className="game-logo">
                    ?
                </div>

                <div className="game-room">

                    <span>SALON</span>

                    <strong>
                        {code}
                    </strong>

                </div>

            </header>


            {/* CONTENU */}

            <section className="reveal-section">

                <div className="reveal-title">

                    <span>
                        TON SECRET
                    </span>

                    <h1>
                        Découvre ton mot
                    </h1>

                    <p>
                        Ne laisse personne regarder ton écran.
                    </p>

                </div>


                {/* CARTE */}

                <div
                    className={
                        `secret-card ${
                            revealed
                                ? "secret-card-revealed"
                                : ""
                        }`
                    }

                    onMouseDown={revealWord}
                    onMouseUp={hideWord}
                    onMouseLeave={hideWord}

                    onTouchStart={revealWord}
                    onTouchEnd={hideWord}

                    onContextMenu={(event) =>
                        event.preventDefault()
                    }
                >

                    {!revealed ? (

                        <div className="secret-hidden">

                            <div className="secret-question">
                                ?
                            </div>

                            <span>
                                MAINTIENS POUR RÉVÉLER
                            </span>

                            <small>
                                Garde ton mot secret
                            </small>

                        </div>

                    ) : (

                        <div className="secret-revealed">

                            <span>
                                TON MOT
                            </span>

                            <h2>
                                {word || "??? "}
                            </h2>

                            <small>
                                Mémorise-le
                            </small>

                        </div>

                    )}

                </div>


                <div className="reveal-warning">

                    <span>◉</span>

                    <p>
                        Relâche pour masquer ton mot
                    </p>

                </div>

                <div className="ready-area">

    {!ready ? (

        <button
            className="ready-button"
            onClick={confirmReady}
        >
            <span>✓</span>
            J'AI MÉMORISÉ
        </button>

    ) : (

        <button
            className="ready-button ready-button-done"
            disabled
        >
            <span>✓</span>
            PRÊT
        </button>

    )}


    <div className="ready-counter">

        <span>
            {ready
                ? "En attente des autres joueurs..."
                : "Mémorise ton mot avant de continuer"
            }
        </span>


        {totalPlayers > 0 && (

            <strong>
                {readyCount} / {totalPlayers} PRÊTS
            </strong>

        )}

    </div>

</div>

            </section>

        </main>
    );
}

export default Game;