// Import necessary modules
const express = require('express'); // Import the express module to create a web server
const mongoose = require('mongoose'); // Import mongoose to connect to MongoDB
const session = require('express-session'); // Import express-session for managing sessions
const passport = require('passport'); // Import passport for authentication
const LocalStrategy = require('passport-local').Strategy; // Import Passport's local strategy for username/password authentication
const bcrypt = require('bcryptjs'); // Import bcryptjs to hash passwords
const http = require('http'); // Import the http module to create an HTTP server
const socketIo = require('socket.io'); // Import socket.io for real-time communication
const cors = require('cors'); // Import CORS to allow cross-origin requests
const multer = require('multer'); // Import multer for file uploads

// Set up multer storage configuration
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/'); // Set the directory to store uploads
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname); // Create a unique filename
	},
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage }); // <-- This is the part where 'upload' is defined

// Import the User model
const User = require('./models/user'); // Adjust the path as necessary

// Initialize the Express application
const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Middleware to enable CORS for cross-origin requests
app.use(cors());

// Connect to MongoDB using Mongoose
mongoose
	.connect('mongodb://localhost/chat-app')
	.then(() => console.log('Connected to MongoDB'))
	.catch((err) => console.error('Error connecting to MongoDB', err));

// Configure Passport.js to use the local strategy for authentication
passport.use(
	new LocalStrategy((username, password, done) => {
		// Find the user in the database by username
		User.findOne({ username: username })
			.then((user) => {
				if (!user) {
					// If user is not found, return with an error message
					return done(null, false, { message: 'Incorrect username.' });
				}
				// If user is found, compare the provided password with the hashed password in the database
				bcrypt.compare(password, user.password, (err, res) => {
					if (res) {
						// If the passwords match, log the user in
						return done(null, user);
					} else {
						// If the passwords do not match, return with an error message
						return done(null, false, { message: 'Incorrect password.' });
					}
				});
			})
			.catch((err) => done(err)); // Handle any errors during the process
	})
);

// Serialize the user to decide which data of the user object should be stored in the session
passport.serializeUser((user, done) => {
	done(null, user.id); // Here we're only storing the user id in the session
});

// Deserialize the user by taking the id from the session and using it to find the full user object
passport.deserializeUser(async (id, done) => {
	try {
		const user = await User.findById(id).exec(); // Use exec() to execute the query and get the result
		done(null, user); // Once found, return the full user object
	} catch (err) {
		done(err, null); // Handle any errors
	}
});

// Middleware to handle sessions
app.use(
	session({
		secret: 'your_secret_key', // This should be a strong secret key in production
		resave: false,
		saveUninitialized: true,
		cookie: { secure: false }, // Set to true in production with HTTPS
	})
);

// Initialize Passport and configure it to manage sessions
app.use(passport.initialize());
app.use(passport.session());

// Define an asynchronous function to handle user registration
const registerUser = async (req, res) => {
	// Extract username, email, and password from the request body
	const { username, email, password } = req.body;

	try {
		// Check if a user with the same username already exists in the database
		const existingUser = await User.findOne({ username });
		if (existingUser) {
			// If a user with the same username is found, return a 400 status with an error message
			return res.status(400).json({ error: 'Username already taken' });
		}

		// Check if a user with the same email already exists in the database
		const existingEmail = await User.findOne({ email });
		if (existingEmail) {
			// If a user with the same email is found, return a 400 status with an error message
			return res.status(400).json({ error: 'Email already registered' });
		}

		// Generate a salt for hashing the password
		const salt = await bcrypt.genSalt(10);
		// Hash the password with the generated salt
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create a new user instance with the provided username, email, and hashed password
		const newUser = new User({
			username,
			email,
			password: hashedPassword,
			date: new Date(), // Set the current date as the user's registration date
		});

		// Save the new user instance to the database
		await newUser.save();

		// If successful, return a 201 status with a success message
		res.status(201).json({ message: 'User registered successfully' });
	} catch (err) {
		// If any error occurs during the process, log the error to the console
		console.error('Error during user registration:', err);
		// Return a 500 status with a generic server error message
		res.status(500).json({ error: 'Server error' });
	}
};
// Define a function to handle user profile updates
const updateUserProfile = async (req, res) => {
	const { firstName, lastName, bio } = req.body;
	const userId = req.user._id; // Assuming the user is authenticated and their ID is available

	try {
		// Find the user by their ID and update the provided fields
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ firstName, lastName, bio },
			{ new: true, runValidators: true }
		);

		if (!updatedUser) {
			return res.status(404).json({ error: 'User not found' });
		}

		res
			.status(200)
			.json({ message: 'Profile updated successfully', user: updatedUser });
	} catch (err) {
		console.error('Error updating profile:', err);
		res.status(500).json({ error: 'Server error' });
	}
};

// Define the /register route to handle user registration
app.post('/register', registerUser);

// Define the /login route to handle user login
app.post('/login', (req, res, next) => {
	const { username, password } = req.body; // Extract user credentials from the request body

	// Use Passport's local strategy to authenticate the user
	passport.authenticate('local', (err, user, info) => {
		if (err) {
			return next(err); // Handle any errors during authentication
		}
		if (!user) {
			return res.status(401).json({ message: 'Login failed' }); // If authentication fails, send a failure response
		}
		req.logIn(user, (err) => {
			if (err) {
				return next(err); // Handle any errors during login
			}
			return res.json({ message: 'Login successful' }); // Send a success response upon successful login
		});
	})(req, res, next);
});
// Define the /upload-profile-picture route to handle profile picture uploads
app.post(
	'/upload-profile-picture',
	upload.single('profilePicture'),
	async (req, res) => {
		const userId = req.user._id; // Assuming the user is authenticated

		try {
			const updatedUser = await User.findByIdAndUpdate(
				userId,
				{ profilePicture: req.file.path }, // Save the file path in the user's profilePicture field
				{ new: true }
			);

			if (!updatedUser) {
				return res.status(404).json({ error: 'User not found' });
			}

			res.status(200).json({
				message: 'Profile picture updated successfully',
				user: updatedUser,
			});
		} catch (err) {
			console.error('Error updating profile picture:', err);
			res.status(500).json({ error: 'Server error' });
		}
	}
);
// Define the /update-profile route to handle profile updates
app.post('/update-profile', updateUserProfile);

// Create an HTTP server using the Express application
const server = http.createServer(app);

// Attach Socket.io to the server for real-time communication
const io = socketIo(server, {
	cors: {
		origin: 'http://localhost:3000', // Allow connections from the frontend
		methods: ['GET', 'POST'], // Allow GET and POST methods
	},
});

// Define a port for the server to listen on
const port = process.env.PORT || 4000;

// Start the server and listen on the defined port
server.listen(port, () => console.log(`Server running on port ${port}`));

// Serve the client files (you can add the React build files here later)
app.use(express.static('public'));

// Handle new connections to the server via Socket.io
io.on('connection', (socket) => {
	console.log('New client connected');

	// Handle incoming chat messages from clients
	socket.on('chat message', (msg) => {
		console.log('Message received:', msg);
		io.emit('chat message', msg); // Emit the chat message to all connected clients
	});

	// Handle client disconnections
	socket.on('disconnect', () => {
		console.log('Client disconnected');
	});
});
