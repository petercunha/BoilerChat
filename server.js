var express = require('express')
var app = express()
var morgan = require('morgan')
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var path = require('path')
var validator = require('validator')
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/boilerchat'
const PORT = 80

// Connect to MongoDB
MongoClient.connect(url, function(err, db) {
	if (err) throw err
})

// Launch the server
server.listen(PORT)
console.log('Server started on localhost:' + PORT)

// Log all requests
app.use(morgan('combined'))


/*
		ROUTES
*/

// Index
app.get('/', (req, res, err) => {
	res.sendFile(path.join(__dirname, 'frontend', 'login.html'))
})

// Chatrooms
app.get('/chat/:id', (req, res, err) => {
	res.sendFile(path.join(__dirname, 'frontend', 'index.html'))
})

// For hackers
app.get('/admin', (req, res, err) => {
	res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
})

// Chat history (API)
app.get('/history/:room', (req, res, err) => {
	var room = atob(validator.escape(req.params.room))
	roomHistory(room, 100, (data) => {
		res.json(data)
	})
})

// Course lookup (API)
app.get('/api/:type/:number', (req, res, err) => {
	MongoClient.connect(url, function(err, db) {
		if (err) throw err

		// Ensure that the query is alphanumeric
		if (!validator.isAlphanumeric(req.params.type) || !validator.isAlphanumeric(req.params.number)) {
			res.json([])
			return false
		}

		// Set max query length
		if (req.params.type.length > 15 || req.params.number.length > 15) {
			res.json([])
			return false
		}

		var courseRegex = new RegExp('^' + req.params.type)
		var numberRegex = new RegExp('^' + req.params.number)

		var aggregation = [{
				$match: {
					'Abbreviation': {
						$regex: courseRegex,
						$options: 'mi'
					}
				}
			},
			{
				$unwind: '$Courses'
			},
			{
				$unwind: '$Courses.Classes'
			},
			{
				$match: {
					'Courses.Number': {
						$regex: numberRegex,
						$options: 'mi'
					}
				}
			},
			{
				$unwind: '$Courses.Classes.Sections'
			},
			{
				$match: {
					'Courses.Classes.Sections.Type': 'Lecture'
				}
			},
			{
				$unwind: '$Courses.Classes.Sections.Meetings'
			},
			{
				$unwind: '$Courses.Classes.Sections.Meetings.Instructors'
			},
			{
				$project: {
					'_id': 0,
					'Subject': '$Abbreviation',
					'Number': '$Courses.Number',
					'Title': '$Courses.Title',
					'Instructor': '$Courses.Classes.Sections.Meetings.Instructors.Name'
				}
			}
		]

		db.collection('classes').aggregate(aggregation).limit(200).toArray(function(err, result) {
			if (err) throw err
			res.send(result)
			db.close()
		})
	})
})

// routing
app.use(express.static(path.join(__dirname, 'frontend')))

// usernames which are currently connected to the chat
var usernames = {}

io.sockets.on('connection', function(socket) {
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username, room) {
		// Sanitize input
		username = validator.escape(username)
		room = validator.escape(room)

		// store the username in the socket session for this client
		socket.username = username
		// store the room name in the socket session for this client
		socket.room = room
		// add the client's username to the global list
		usernames[username] = username
		// send client to room 1
		socket.join(room)

		// Send the number of online users in a room
		var onlineUsers = io.sockets.adapter.rooms[room];
		if (onlineUsers != null && onlineUsers && onlineUsers.length) {
			// Emit to room
			socket.broadcast.to(room).emit('updateusers', 'SERVER-MSG', onlineUsers.length)
			// Emit to user
			socket.emit('updateusers', 'SERVER-MSG', onlineUsers.length)
		}

		// echo to client they've connected
		socket.emit('updatechat', 'SERVER-MSG', 'You have connected to ' + atob(room).split(':')[0])
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(room).emit('updatechat', 'SERVER-MSG', username + ' has connected to this room')
	})

	// When the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function(data) {

		// Sanitize input
		data = validator.escape(data)
		username = validator.escape(socket.username)
		room = atob(socket.room).split(':')

		var msg = {
			user: username,
			message: data,
			timestamp: new Date(),
			ip: socket.request.connection.remoteAddress,
			class: room[0],
			teacher: room[2]
		}

		// Log to console
		console.log('Message recieved: ' + JSON.stringify(msg))

		// Store the message in the database
		storeMessageInDB({
			room: atob(validator.escape(socket.room)),
			timestamp: new Date(),
			user: username,
			message: data
		})

		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', username, data)
	})

	socket.on('switchRoom', function(newroom) {
		// Sanitize input
		newroom = validator.escape(newroom)

		socket.leave(socket.room)
		socket.join(newroom)
		socket.emit('updatechat', 'SERVER-MSG', 'You have connected to ' + newroom)
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER-MSG', socket.username + ' has left this room')
		// update socket session room title
		socket.room = newroom
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER-MSG', socket.username + ' has joined this room')
		// socket.emit('updaterooms', rooms, newroom)
	})

	// when the user disconnects.. perform this
	socket.on('disconnect', function() {
		// remove the username from global usernames list
		delete usernames[socket.username]
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames)

		// Send the number of online users in a room
		var onlineUsers = io.sockets.adapter.rooms[socket.room];
		if (onlineUsers != null && onlineUsers && onlineUsers.length) {
			socket.broadcast.to(socket.room).emit('updateusers', 'SERVER-MSG', onlineUsers.length)
		}

		// echo globally that this client has left
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER-MSG', socket.username + ' has disconnected')
		socket.leave(socket.room)
	})
})

// Stores message in MongoDB
function storeMessageInDB(obj) {
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		db.collection('messages').insertOne(obj, function(err, res) {
			if (err) throw err
			db.close()
		})
	})
}

// Gets most recent message history from a chatroom
function roomHistory(room, lim, callback) {
	MongoClient.connect(url, function(err, db) {
		if (err) throw err
		db.collection('messages')
			.find({
				'room': room
			})
			.sort({
				'timestamp': -1
			})
			.project({
				_id: 0,
				'user': 1,
				'message': 1
			})
			.limit(lim)
			.toArray(function(err, res) {
				if (err) throw err
				callback(res)
				db.close()
			})
	})
}

function atob(str) {
	return Buffer.from(str, 'base64').toString('ascii')
}

function btoa(str) {
	return Buffer.from(str).toString('base64')
}
