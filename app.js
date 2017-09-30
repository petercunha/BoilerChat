var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var path = require('path')
var MongoClient = require('mongodb').MongoClient
var url = "mongodb://localhost:27017/boilerchat"
const PORT = 8080

// Connect to MongoDB
MongoClient.connect(url, function(err, db) {
	if (err) throw err
})

// Launch the server
server.listen(PORT)
console.log('Server started on localhost:8080')

app.get("/chat/:id", (req, res, err) => {
	res.sendFile(path.join(__dirname, 'frontend', 'index.html'))
})

app.get("/api/:query", (req, res, err) => {
	MongoClient.connect(url, function(err, db) {
		if (err) throw err

		var number_reg = new RegExp('^' + req.params.query)
    var title_reg = new RegExp(req.params.query)

		var query = {
      $or: [
  			{
          "Number": {
    				$regex: number_reg,
    				$options: "mi"
    			}
        },
        {
          "Title": {
    				$regex: title_reg,
    				$options: "i"
    			}
        },
      ]
		}

		db.collection("courses").find(query).limit(8).toArray(function(err, result) {
			if (err) throw err
      var final = []
      for (var i = 0; i < result.length; i++) {
        var curr = result[i]
        final[i] = `${curr.Title} (${curr.Number})`
      }
			res.send(final)
			db.close()
		})
	})
})

// routing
app.use(express.static(path.join(__dirname, 'frontend')))

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['CS 180', 'CS 240', 'CS 361'];

io.sockets.on('connection', function(socket) {

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username) {
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'CS 180';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('CS 180');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER-MSG', 'You have connected to ' + socket.room);
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER-MSG', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function(data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});

	socket.on('switchRoom', function(newroom) {
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER-MSG', 'You have connected to ' + newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER-MSG', socket.username + ' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER-MSG', socket.username + ' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});


	// when the user disconnects.. perform this
	socket.on('disconnect', function() {
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER-MSG', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
