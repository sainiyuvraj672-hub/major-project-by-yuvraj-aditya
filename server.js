const express = require('express');
const path = require('path');
const db = require('./config/db'); // Ensure your DB credentials are correct here

const app = express();
const PORT = 3000;

// Middleware to handle JSON data from your Admin and Voter forms
app.use(express.json());

// --- 1. STATIC FILE SERVICING ---
// Serve the main Landing Page (home.html) [cite: 1]
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Serve all other frontend files (CSS, JS, Images) [cite: 1]
app.use(express.static(path.join(__dirname, 'public')));


// --- 2. ADMIN API ROUTES ---

// Create a new election instance and return the auto-generated ID [cite: 1]
app.post('/api/admin/create-election', (req, res) => {
    const { title } = req.body;
    db.query('INSERT INTO elections (title) VALUES (?)', [title], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, electionId: result.insertId });
    });
});

// Add a candidate/party to a specific election 
app.post('/api/admin/add-candidate', (req, res) => {
    const { party_name, election_id } = req.body;
    db.query('INSERT INTO candidates (party_name, election_id) VALUES (?, ?)', 
    [party_name, election_id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: 'Candidate Added successfully!' });
    });
});

// Register a voter and map them to a specific election ID 
// Register a voter and map them to a specific election ID + Retina Hash
app.post('/api/admin/add-voter', (req, res) => {
    // 1. Added 'retina_hash' to the destructured body
    const { voter_id, name, election_id, retina_hash } = req.body; 

    // 2. Updated SQL Query to include the 4th column: retina_hash
    const query = 'INSERT INTO voters (voter_id, name, election_id, retina_hash) VALUES (?, ?, ?, ?)';
    
    db.query(query, [voter_id, name, election_id, retina_hash], (err) => {
        if (err) {
            // Check for duplicate Voter IDs in the same election
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, error: 'Voter ID already registered for this election!' });
            }
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: 'Voter Registered successfully with Biometrics!' });
    });
});


// --- 3. VOTER API ROUTES ---

// Voter Login: Verifies ID and Election ID match 
app.post('/api/login', (req, res) => {
    const { voterId, electionId } = req.body;
    db.query('SELECT * FROM voters WHERE voter_id = ? AND election_id = ?', 
    [voterId, electionId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json({ success: true, voter: results[0] });
        } else {
            res.json({ success: false, message: 'Identity not found for this election ID!' });
        }
    });
});

// Get Candidates: Fetches ONLY candidates belonging to the logged-in election 
app.get('/api/candidates/:electionId', (req, res) => {
    db.query('SELECT * FROM candidates WHERE election_id = ?', [req.params.electionId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Cast Vote: Updates tally and prevents double-voting [cite: 1]
app.post('/api/vote', (req, res) => {
    const { voterId, candidateId, electionId } = req.body;
    
    // Check if voter has already voted in this election
    db.query('SELECT * FROM voting_logs WHERE voter_id = ? AND election_id = ?', [voterId, electionId], (err, logs) => {
        if (err) return res.status(500).json({ error: err.message });
        if (logs.length > 0) return res.json({ success: false, message: 'You have already cast your vote!' });

        // Update candidate vote count
        db.query('UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?', [candidateId], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // Log the vote to lock the Voter ID
            db.query('INSERT INTO voting_logs (voter_id, election_id) VALUES (?, ?)', [voterId, electionId], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, message: 'Vote cast successfully!' });
            });
        });
    });
});

// Results: Get Election Title [cite: 1]
app.get('/api/election-details/:electionId', (req, res) => {
    db.query('SELECT title FROM elections WHERE id = ?', [req.params.electionId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ title: "Election Not Found" });
        }
    });
});


// --- 4. SERVER INITIALIZATION ---
app.listen(PORT, () => {
    console.log(`🚀 FairVote System Live: http://localhost:${PORT}`);
});