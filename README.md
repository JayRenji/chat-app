# chat-app
Real-time chat application using React for the front-end and Node.js with Socket.io for the back-end. 

Here’s a quick summary:

Project Initialization:
-Set up a new React application using create-react-app.
-Initialized a Node.js server with Express and Socket.io.

Server-Side Implementation:
-Configured an Express server to serve static files and handle WebSocket connections.
-Set up Socket.io to manage real-time messaging between clients.

Client-Side Implementation:
-Created a React component to handle user input and display chat messages.
-Connected the React front-end to the Node.js back-end using Socket.io-client.

Adding Usernames:
-Implemented functionality for users to set and display their usernames with each message.
-Modified both client and server code to handle and broadcast usernames along with messages.

Styling with Tailwind CSS:
-Integrated Tailwind CSS for styling the chat application.
-Resolved issues related to integrating PostCSS and Tailwind in the project -setup. (What a kick in the PANTS that was...)

Testing and Debugging:
-Thoroughly tested the application by running multiple instances and ensuring real-time updates.
-Debugged issues related to CORS policy and connection errors.(Another kick here...)

Key Technologies Used:
-React: For building the user interface.
-Node.js: For creating the server.
-Express: For server setup and static file serving.
-Socket.io: For real-time communication.
-Tailwind CSS: For styling.
