function handleSignInResponse(response) {
    try {
        // Decode JWT
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const userPayload = JSON.parse(window.atob(base64));

        // Save session
        localStorage.setItem("userName", userPayload.name);
        localStorage.setItem("userPic", userPayload.picture);
        localStorage.setItem("isLoggedIn", "true");

        alert(`Welcome, ${userPayload.name}!`);
        window.location.href = "home.html"; // Redirect back home to show profile
    } catch (e) {
        console.error("Auth Error:", e);
    }
}

window.onload = function () {
    google.accounts.id.initialize({
        client_id: "1038426303417-14rotj8bsct6ke7krl3k365i3su4v96.apps.googleusercontent.com",
        callback: handleSignInResponse,
        ux_mode: "popup" // Force a popup window
    });

    google.accounts.id.renderButton(
        document.getElementById("google-btn-container"),
        { theme: "outline", size: "large", width: "340", shape: "pill" }
    );
};

function handleSignInResponse(response) {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const userPayload = JSON.parse(window.atob(base64));

    localStorage.setItem("userName", userPayload.name);
    localStorage.setItem("userPic", userPayload.picture);
    localStorage.setItem("isLoggedIn", "true");

    alert(`Welcome, ${userPayload.name}!`);
    window.location.href = "home.html";
}