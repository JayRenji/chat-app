// Import Mongoose, which is used to interact with MongoDB
const mongoose = require('mongoose');

// Import bcrypt for hashing passwords
const bcrypt = require('bcryptjs');

// Define the schema for a User in MongoDB
const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true, // The username is required
		unique: true, // The username must be unique across all users
	},
	email: {
		type: String,
		required: true, // The email is required
		unique: true, // The email must be unique across all users
	},
	password: {
		type: String,
		required: true, // The password is required
	},
	firstName: {
		type: String,
		required: false, // Optional first name field
	},
	lastName: {
		type: String,
		required: false, // Optional last name field
	},
	profilePicture: {
		type: String, // This will store the file path or URL to the profile picture
		required: false, // Optional profile picture field
	},
	bio: {
		type: String,
		required: false, // Optional bio field for user profile
	},
	date: {
		type: Date,
		default: Date.now, // The default value for the date field is the current date and time
	},
});
// Pre-save hook for password hashing
UserSchema.pre('save', async function (next) {
	// If the password field has not been modified, move to the next middleware or save operation
	if (!this.isModified('password')) return next();

	try {
		// Generate a salt for hashing the password
		const salt = await bcrypt.genSalt(10);
		// Hash the password with the generated salt and assign it to the user's password field
		this.password = await bcrypt.hash(this.password, salt);
		// Call the next middleware or save operation
		next();
	} catch (err) {
		// If there's an error, pass it to the next middleware or save operation
		next(err);
	}
});

// Create a Mongoose model based on the UserSchema
const User = mongoose.model('User', UserSchema);

// Export the User model so it can be used in other files
module.exports = User;
