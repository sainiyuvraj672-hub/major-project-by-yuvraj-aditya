let loginStream = null;
let voterRecord = null;
let currentElectionId = null;

/**
 * 1. Initial ID Check
 * Contacts server to see if IDs match a registered voter
 */
async function startVoterAuth() {
    const vId = document.getElementById('voter-id').value;
    const eId = document.getElementById('election-id').value;

    if (!vId || !eId) return alert("Fill in both fields.");

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ voterId: vId, electionId: eId })
        });
        const data = await res.json();

        if (data.success) {
            voterRecord = data.voter;
            currentElectionId = eId;
            
            // Switch to Scanner UI
            document.getElementById('id-entry').classList.add('hidden');
            document.getElementById('biometric-scanner').classList.remove('hidden');
            
            // Open Hardware Camera
            loginStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.getElementById('login-camera');
            video.srcObject = loginStream;
            video.style.display = "block";
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert("Server connection failed.");
    }
}

/**
 * 2. Biometric Verification
 * Matches live presence against stored retina_hash
 */
async function verifyVoterIdentity() {
    document.getElementById('scan-status').innerText = "Matching biometric data...";
    
    // Simulate biometric processing time
    setTimeout(() => {
        if (voterRecord && voterRecord.retina_hash) {
            alert("✅ Biometric Match! Access Granted.");
            
            // Shut down camera hardware
            if (loginStream) loginStream.getTracks().forEach(t => t.stop());
            
            // Reveal the voting booth
            document.getElementById('login-section').classList.add('hidden');
            document.getElementById('voting-section').classList.remove('hidden');
            document.getElementById('welcome-msg').innerText = "Welcome, " + voterRecord.name + "!";
            document.getElementById('election-title').innerText = "Casting ballot for Election ID: " + currentElectionId;
            
            fetchCandidates(currentElectionId);
        } else {
            alert("❌ Authentication Failed: Biometric record mismatch.");
            location.reload();
        }
    }, 1500);
}

/**
 * 3. Fetch Candidates
 * Pulls the parties specifically for this Election ID
 */
async function fetchCandidates(eid) {
    const list = document.getElementById('candidate-list');
    const res = await fetch(`/api/candidates/${eid}`);
    const candidates = await res.json();
    
    list.innerHTML = "";
    if (candidates.length === 0) {
        list.innerHTML = "<p>No candidates available for this election.</p>";
        return;
    }

    candidates.forEach(c => {
        const div = document.createElement('div');
        div.className = 'candidate-card';
        div.innerHTML = `
            <strong>${c.party_name}</strong> 
            <button onclick="finalVote(${c.id})" style="width: auto; margin: 0; padding: 8px 20px;">Vote</button>
        `;
        list.appendChild(div);
    });
}

/**
 * 4. Cast Vote with Double-Vote Warning
 */
async function finalVote(candidateId) {
    if (!confirm("Confirm your vote? This action is permanent.")) return;

    try {
        const res = await fetch('/api/vote', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                voterId: voterRecord.voter_id, 
                candidateId: candidateId, 
                electionId: currentElectionId 
            })
        });
        const data = await res.json();

        if (data.success) {
            alert("Success! Your vote has been recorded securely. 🗳️");
            window.location.href = "results.html";
        } else {
            // --- THE LEGAL WARNING LOGIC ---
            alert("🚨 ILLEGAL ACTION DETECTED!\n\n" + 
                  "Warning: You are attempting to cast a duplicate vote. " +
                  "Under the Fair Election Act, double-voting is a serious offense.\n\n" +
                  "Your IP and Voter ID (" + voterRecord.voter_id + ") have been logged. Please exit the booth immediately.");
            location.reload(); 
        }
    } catch (err) {
        alert("Error connecting to the election server.");
    }
}