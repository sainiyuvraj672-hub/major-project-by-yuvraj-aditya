// --- 1. ADMIN SECURITY ---
// Basic password protection to prevent unauthorized access
window.onload = function() {
    const auth = prompt("Enter Admin Password to access Control Center:");
    if (auth !== "admin123") { 
        alert("Access Denied! Returning to Home.");
        window.location.href = "/"; 
    }
};

// --- 2. ELECTION INITIALIZATION ---
async function createElection() {
    const titleInput = document.getElementById('new-title');
    const title = titleInput.value.trim();

    if (!title) return alert("Error: Please enter an election title.");

    try {
        const res = await fetch('/api/admin/create-election', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ title: title }) 
        });
        const data = await res.json();
        if (data.success) {
            alert("Election Initialized! New ID: " + data.electionId);
            document.getElementById('election-id-context').value = data.electionId;
            titleInput.value = '';
        }
    } catch (err) {
        alert("Server connection failed.");
    }
}

// --- 3. CANDIDATE MANAGEMENT ---
async function addCandidate() {
    const nameInput = document.getElementById('new-candidate-name');
    const eidInput = document.getElementById('election-id-context');
    const name = nameInput.value.trim();
    const eid = eidInput.value.trim();

    if (!name || !eid) return alert("Error: Name and Election ID are required.");

    try {
        const res = await fetch('/api/admin/add-candidate', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'}, 
            body: JSON.stringify({ party_name: name, election_id: eid }) 
        });
        const data = await res.json();
        if (data.success) {
            alert("Success: " + data.message);
            nameInput.value = '';
        }
    } catch (err) {
        console.error("Candidate API failed:", err);
    }
}

// --- 4. VOTER REGISTRATION WITH BIOMETRIC SCAN ---

let stream = null; // GLOBAL VARIABLE (Must stay outside the functions)

// Function to turn on the Camera
async function openCamera() {
    console.log("Attempting to open camera...");
    const video = document.getElementById('voter-camera');
    const btn = document.getElementById('btn-camera');
    
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.style.display = "block"; // Make the black box visible
        btn.innerText = "Scanner Ready ✅";
        btn.style.background = "#2ecc71";
    } catch (err) {
        console.error("Camera Error:", err);
        alert("Camera Error: Please ensure you have allowed camera permissions.");
    }
}

// Registers a voter ID with a simulated Retina Hash
async function addVoter() {
    const idInput = document.getElementById('new-voter-id');
    const nameInput = document.getElementById('new-voter-name');
    const eidInput = document.getElementById('election-id-context');

    const voter_id = idInput.value.trim();
    const name = nameInput.value.trim();
    const election_id = eidInput.value.trim();

    // Biometric Validation
    if (!stream) return alert("SECURITY PROTOCOL: Please click 'Open Scanner' to capture biometric data first!");
    if (!voter_id || !name || !election_id) return alert("Error: Please fill in all fields.");

    const retina_hash = "RETINA_" + Math.random().toString(36).substr(2, 9).toUpperCase();

    try {
        const response = await fetch('/api/admin/add-voter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ voter_id, name, election_id, retina_hash })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert(`Voter Registered Successfully!\nName: ${name}\nBiometric Hash: ${retina_hash}`);
            
            // --- NEW: Generate the Voter Card ---
            const confirmDownload = confirm("Would you like to download the Voter Registration Card?");
            if (confirmDownload) {
                generateVoterCard(name, voter_id, election_id, retina_hash);
            }

            // Turn off camera
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                document.getElementById('voter-camera').style.display = "none";
                stream = null;
                document.getElementById('btn-camera').innerText = "Open Scanner";
                document.getElementById('btn-camera').style.background = "#4a4a4a";
            }
            
            // Reset UI
            idInput.value = '';
            nameInput.value = '';
        } else {
            alert("Registration Failed: " + (data.error || "Check server logs."));
        }
    } catch (err) {
        alert("Connection Error.");
    }
}

/**
 * NEW FUNCTION: Generates a professional Voter ID Card PDF
 */
function generateVoterCard(name, vId, eId, hash) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [120, 80] }); // Wallet sized card

    // Card Design
    doc.setFillColor(0, 209, 178); // FairVote Green
    doc.rect(0, 0, 120, 15, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("FAIRVOTE - REGISTRATION CARD", 60, 10, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Voter Name: ${name}`, 10, 25);
    doc.text(`Voter ID: ${vId}`, 10, 35);
    doc.text(`Election Context ID: ${eId}`, 10, 45);
    doc.text(`Biometric Hash: ${hash}`, 10, 55);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Status: VERIFIED & REGISTERED", 10, 65);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, 70);

    // Decorative Border
    doc.setDrawColor(0, 209, 178);
    doc.setLineWidth(1);
    doc.rect(2, 2, 116, 76);

    doc.save(`VoterCard_${vId}.pdf`);
}