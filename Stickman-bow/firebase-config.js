
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Referensi ke database
const database = firebase.database();

// Referensi ke collection scores
const scoresRef = database.ref('scores');

// Fungsi untuk menyimpan skor
function saveScore(playerName, score, level) {
    return scoresRef.push({
        name: playerName,
        score: score,
        level: level,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

// Fungsi untuk mengambil leaderboard
function getLeaderboard(callback) {
    scoresRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
        const scores = [];
        snapshot.forEach((childSnapshot) => {
            scores.push({
                id: childSnapshot.key,
                ...childSnapshot.val()
            });
        });
        // Urutkan dari skor tertinggi
        scores.sort((a, b) => b.score - a.score);
        callback(scores);
    });
}

// Fungsi untuk mengambil skor tertinggi
function getHighScore(callback) {
    scoresRef.orderByChild('score').limitToLast(1).on('value', (snapshot) => {
        let highScore = 0;
        snapshot.forEach((childSnapshot) => {
            highScore = childSnapshot.val().score;
        });
        callback(highScore);
    });
}

// Fungsi untuk menghapus semua skor (untuk testing)
function clearAllScores() {
    scoresRef.remove()
        .then(() => console.log('Semua skor dihapus'))
        .catch((error) => console.error('Error:', error));
}

// Export untuk digunakan di game.js
window.firebaseConfig = firebaseConfig;
window.saveScore = saveScore;
window.getLeaderboard = getLeaderboard;
window.getHighScore = getHighScore;
window.clearAllScores = clearAllScores;