const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root', // 🚨 CHANGE THIS TO YOUR ACTUAL PASSWORD!
    database: 'evoting_db'
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL database successfully! 🚀');
});

module.exports = db;