const express = require('express');
const { Readable } = require('stream');
const app = express();
const port = 3000;

// To store connected clients and their unique identifiers
const clients = new Map(); // Map<clientId, response>

// Route for clients to send audio streams (using streaming fetch)
app.post('/send-audio', (req, res) => {
  const clientId = req.query.id; // Get clientId from query params

  req.on('data', (chunk) => {
    // Broadcast the received audio chunk to all other users except the sender
    for (const [otherClientId, otherRes] of clients.entries()) {
      if (otherClientId !== clientId) {
        otherRes.write(chunk); // Directly stream the raw audio data
      }
    }
  });

  // End response when the stream is closed
  req.on('end', () => {
    res.status(200).end();
  });
});

// Route to connect clients and start receiving audio streams via fetch streaming
app.get('/receive-audio', (req, res) => {
  const clientId = req.query.id; // Get clientId from query params

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Store the response to push audio data later
  clients.set(clientId, res);

  // When client disconnects, clean up
  req.on('close', () => {
    clients.delete(clientId);
  });
});

app.listen(port, () => {
  console.log(`Voice chat server running at http://localhost:${port}`);
});
