
const $ = (id) => document.getElementById(id);

let selectedMinutes = 60;
let remainingSeconds = 3600;
let endTime = null;
let timerInterval = null;
let running = false;
let paused = false;

let progress = JSON.parse(
    localStorage.getItem("cherrycraft-progress") || "null"
) || {
    flowers: 0,
    books: 0,
    apples: 0,
    minutes: 0,
    sessions: 0
};

// Display the countdown
function updateDisplay() {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;

    $("timer").textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

// Save the current session
function saveSession() {
    localStorage.setItem("cherrycraft-session",
        JSON.stringify({
            selectedMinutes,
            remainingSeconds,
            endTime,
            running,
            paused
        })
    );
}

// Choose a study duration
function selectTime(minutes) {
    if (running || paused) return;

    selectedMinutes = minutes;
    remainingSeconds = minutes * 60;

    document.querySelectorAll("[data-minutes]")
        .forEach(button => {
            button.classList.toggle(
                "selected",
                Number(button.dataset.minutes) === minutes
            );
        });

    updateDisplay();
    saveSession();
}

document.querySelectorAll("[data-minutes]")
    .forEach(button => {
        button.addEventListener("click", () => {
            selectTime(Number(button.dataset.minutes));
        });
    });

// Custom study duration
$("custom-time").addEventListener("click", () => {
    if (running || paused) return;

    const minutes = Number(
        prompt("How many minutes would you like to study?", "60")
    );

    if (Number.isInteger(minutes) &&
        minutes > 0 && minutes <= 600) {
        selectTime(minutes);
    }
});

// Update the buttons
function updateButtons() {
    const active = running || paused;

    $("start-button").hidden = active;
    $("pause-button").hidden = !active;
    $("end-button").hidden = !active;

    $("pause-button").textContent =
        paused ? "Resume" : "Pause";

    document.querySelectorAll("[data-minutes], #custom-time")
        .forEach(button => {
            button.disabled = active;
        });
}

// Start a study session
function startSession() {
    if (running || paused) return;

    running = true;
    paused = false;

    endTime = Date.now() + remainingSeconds * 1000;

    $("session-status").textContent =
        "Your quest has begun ♡";

    $("garden-message").textContent =
        "Your garden is growing...";

    updateButtons();
    saveSession();
    startCountdown();
}

// Calculate time using the actual clock
function tick() {
    if (!running) return;

    remainingSeconds = Math.max(
        0,
        Math.ceil((endTime - Date.now()) / 1000)
    );

    updateDisplay();

    if (remainingSeconds === 0) {
        finishSession();
    }
}

function startCountdown() {
    clearInterval(timerInterval);
    timerInterval = setInterval(tick, 250);
    tick();
}

// Pause or resume
function togglePause() {
    if (running) {
        tick();

        if (!running) return;

        running = false;
        paused = true;
        endTime = null;

        clearInterval(timerInterval);

        $("session-status").textContent =
            "Taking a little break ♡";
    } else if (paused) {
        running = true;
        paused = false;

        endTime = Date.now() +
            remainingSeconds * 1000;

        $("session-status").textContent =
            "Back to your quest ♡";

        startCountdown();
    }

    updateButtons();
    saveSession();
}

// Complete a session and earn rewards
function finishSession() {
    if (!running && !paused) return;

    clearInterval(timerInterval);

    running = false;
    paused = false;
    endTime = null;
    remainingSeconds = 0;

    progress.minutes += selectedMinutes;
    progress.sessions++;
    progress.flowers++;

    if (selectedMinutes >= 45) {
        progress.apples++;
    }

    if (selectedMinutes >= 60) {
        progress.books++;
    }

    localStorage.setItem(
        "cherrycraft-progress",
        JSON.stringify(progress)
    );

    $("session-status").textContent =
        "Quest complete! ♡";

    $("garden-message").textContent =
        "Your garden has grown! New rewards unlocked.";

    remainingSeconds = selectedMinutes * 60;

    saveSession();
    updateProgress();
    updateButtons();

    $("timer").textContent = "00:00";
}

// End a session early
function endSession() {
    if (!confirm("End your study session early?")) return;

    clearInterval(timerInterval);

    running = false;
    paused = false;
    endTime = null;

    remainingSeconds = selectedMinutes * 60;

    $("session-status").textContent =
        "Ready for another quest?";

    $("garden-message").textContent =
        "Your garden is waiting...";

    updateDisplay();
    updateButtons();
    saveSession();
}

// Display rewards and statistics
function updateProgress() {
    $("flowers").textContent = progress.flowers;
    $("books").textContent = progress.books;
    $("apples").textContent = progress.apples;

    $("total-minutes").textContent = progress.minutes;
    $("total-sessions").textContent = progress.sessions;
}

// Save auto-reply preferences
$("auto-reply").checked =
    localStorage.getItem("cherrycraft-auto-reply") === "true";

$("auto-reply").addEventListener("change", () => {
    localStorage.setItem(
        "cherrycraft-auto-reply",
        $("auto-reply").checked
    );

    $("reply-status").textContent =
        $("auto-reply").checked
        ? "Enabled — iPhone integration pending"
        : "Automatic replies disabled";
});

const savedReply = localStorage.getItem("cherrycraft-reply");

if (savedReply !== null) {
    $("reply-message").value = savedReply;
}

$("reply-message").addEventListener("input", () => {
    localStorage.setItem(
        "cherrycraft-reply",
        $("reply-message").value
    );
});

// Connect the buttons
$("start-button").addEventListener("click", startSession);
$("pause-button").addEventListener("click", togglePause);
$("end-button").addEventListener("click", endSession);

// Restore an existing session
function restoreSession() {
    const saved = JSON.parse(
        localStorage.getItem("cherrycraft-session") || "null"
    );

    if (saved) {
        selectedMinutes = saved.selectedMinutes;
        remainingSeconds = saved.remainingSeconds;
        endTime = saved.endTime;
        running = saved.running;
        paused = saved.paused;
    }

    updateDisplay();
    updateButtons();
    updateProgress();

    if (running) {
        $("session-status").textContent =
            "Your quest has begun ♡";

        startCountdown();
    } else if (paused) {
        $("session-status").textContent =
            "Taking a little break ♡";
    }
}

document.addEventListener("visibilitychange", () => {
    if (!document.hidden && running) {
        tick();
    }
});

restoreSession();



// CHERRYCRAFT IPHONE INTEGRATION

const isIPhone = /iPhone|iPad|iPod/.test(
    navigator.userAgent
);

let replyActive = localStorage.getItem(
    "cherrycraft-reply-active"
) === "true";

function runShortcut(name, input = "") {
    if (!isIPhone) return;

    const url =
        "shortcuts://run-shortcut?name=" +
        encodeURIComponent(name) +
        "&input=text&text=" +
        encodeURIComponent(input);

    window.location.href = url;
}

function startAutoReply() {
    if (!$("auto-reply").checked || !isIPhone) return;

    const minutes = Math.ceil(remainingSeconds / 60);

    replyActive = true;

    localStorage.setItem(
        "cherrycraft-reply-active", "true"
    );

    $("reply-status").textContent =
        "Auto-reply activation requested";

    runShortcut("Cherrycraft Start", String(minutes));
}

function stopAutoReply() {
    if (!replyActive) return;

    replyActive = false;

    localStorage.setItem(
        "cherrycraft-reply-active", "false"
    );

    $("reply-status").textContent =
        "Auto-reply shutoff requested";

    runShortcut("Cherrycraft Stop");
}

$("start-button").addEventListener("click", () => {
    if (running) startAutoReply();
});

$("pause-button").addEventListener("click", () => {
    if (paused) {
        stopAutoReply();
    } else if (running) {
        startAutoReply();
    }
});

$("end-button").addEventListener("click", () => {
    if (!running && !paused) {
        stopAutoReply();
    }
});

$("auto-reply").addEventListener("change", () => {
    if (!$("auto-reply").checked) {
        stopAutoReply();
    } else if (running) {
        startAutoReply();
    }
});

if (isIPhone) {
    $("reply-status").textContent =
        "iPhone shortcut integration ready for testing";
} else {
    $("reply-status").textContent =
        "Automatic replies available on iPhone only";
}


if ("serviceWorker" in navigator &&
    location.protocol === "https:") {

    navigator.serviceWorker.register("./sw.js")
        .then(() => {
            console.log("Cherrycraft offline mode ready!");
        })
        .catch(error => {
            console.log("Offline setup failed:", error);
        });
}
