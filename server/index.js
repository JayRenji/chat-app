// Import the express module
const express = require('express');
// Import the http module
const http = require('http');
// Import the socket.io module
const socketIo = require('socket.io');
// Import the cors module
const cors = require('cors');

// Create an Express application
const app = express();

// Use the cors middleware to allow cross-origin requests
app.use(cors());

// Create an HTTP server using the Express application
const server = http.createServer(app);

// Attach Socket.io to the server
const io = socketIo(server, {
	cors: {
		origin: 'http://localhost:3000',
		methods: ['GET', 'POST'],
	},
});

// Define a port for the server to listen on
const port = process.env.PORT || 4000;

// Serve the client files (we will add the React build files here later)
app.use(express.static('public'));

// Handle new connections to the server
io.on('connection', (socket) => {
	console.log('New client connected');

	// Handle incoming chat messages from clients
	socket.on('chat message', (msg) => {
		console.log('Message received:', msg);
		// Emit the chat message to all connected clients
		io.emit('chat message', msg);
	});

	// Handle client disconnections
	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});

// Start the server and listen on the defined port
server.listen(port, () => console.log(`Server running on port ${port}`));
