require('dotenv').config();  // Add this line to use .env file
const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { Dropbox } = require('dropbox');

const app = express();
app.use(bodyParser.json());

// Get credentials from environment variables
const APP_KEY = process.env.APP_KEY;
const APP_SECRET = process.env.APP_SECRET;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

// Initialize Dropbox client
const dbx = new Dropbox({ 
    clientId: APP_KEY,
    clientSecret: APP_SECRET
});

// Webhook verification endpoint
app.get('/webhook', (req, res) => {
    const challenge = req.query.challenge;
    res.send(challenge);
});

// Webhook notification endpoint
app.post('/webhook', async (req, res) => {
    const signature = req.headers['x-dropbox-signature'];
    const calculatedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

    if (signature !== calculatedSignature) {
        return res.status(403).send('Invalid signature');
    }

    try {
        const result = await dbx.filesListFolder({path: '/Recordings'});
        
        for (const entry of result.entries) {
            if (entry['.tag'] === 'file' && entry.path_lower.endsWith('.mp4')) {
                await processRecording(entry);
            }
        }

        res.status(200).send('Webhook processed');
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error processing webhook');
    }
});

async function processRecording(file) {
    console.log(`Processing recording: ${file.path_display}`);
    // Add your custom processing logic here
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});