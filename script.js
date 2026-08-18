const createButton =
    document.getElementById("createGame");

const joinButton =
    document.getElementById("joinGame");

const pseudoInput =
    document.getElementById("pseudo");

const roomCodeInput =
    document.getElementById("roomCode");

const notification =
    document.getElementById("notification");


/* ============================== */
/* NOTIFICATIONS                  */
/* ============================== */

function showNotification(message, error = false) {

    notification.textContent = message;

    notification.classList.remove(
        "show",
        "error"
    );

    if (error) {
        notification.classList.add("error");
    }

    setTimeout(() => {
        notification.classList.add("show");
    }, 10);

    setTimeout(() => {
        notification.classList.remove("show");
    }, 2500);
}


/* ============================== */
/* CODE SALON                     */
/* ============================== */

function generateRoomCode() {

    const characters =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 5; i++) {

        const randomIndex =
            Math.floor(
                Math.random() *
                characters.length
            );

        code += characters[randomIndex];
    }

    return code;
}


/* ============================== */
/* CRÉER                          */
/* ============================== */

createButton.addEventListener(
    "click",
    () => {

        const pseudo =
            pseudoInput.value.trim();

        if (!pseudo) {

            showNotification(
                "Entre ton pseudo pour continuer.",
                true
            );

            pseudoInput.focus();

            return;
        }

        const roomCode =
            generateRoomCode();

        console.log(
            "Salon créé :",
            roomCode
        );

        showNotification(
            `Salon ${roomCode} créé !`
        );
    }
);


/* ============================== */
/* REJOINDRE                      */
/* ============================== */

joinButton.addEventListener(
    "click",
    () => {

        const pseudo =
            pseudoInput.value.trim();

        const roomCode =
            roomCodeInput
                .value
                .trim()
                .toUpperCase();

        if (!pseudo) {

            showNotification(
                "Entre ton pseudo pour continuer.",
                true
            );

            pseudoInput.focus();

            return;
        }

        if (roomCode.length !== 5) {

            showNotification(
                "Le code du salon doit contenir 5 caractères.",
                true
            );

            roomCodeInput.focus();

            return;
        }

        console.log(
            `${pseudo} rejoint ${roomCode}`
        );

        showNotification(
            `Connexion au salon ${roomCode}...`
        );
    }
);


/* ============================== */
/* CODE AUTOMATIQUEMENT MAJUSCULE */
/* ============================== */

roomCodeInput.addEventListener(
    "input",
    () => {

        roomCodeInput.value =
            roomCodeInput.value
                .toUpperCase()
                .replace(
                    /[^A-Z0-9]/g,
                    ""
                );
    }
);