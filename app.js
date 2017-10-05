var express = require('express')
var app = express()
var http = require('http')
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var path = require('path')
var validator = require('validator')
var MongoClient = require('mongodb').MongoClient
var url = 'mongodb://localhost:27017/boilerchat'
const PORT = 80

// Connect to MongoDB
MongoClient.connect(url, function (err, db) {
  if (err) throw err
})

// Launch the server
server.listen(PORT)
console.log('Server started on localhost:' + PORT)

app.get('/', (req, res, err) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'))
})

app.get('/chat/:id', (req, res, err) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'))
})

app.get('/api/:type/:number', (req, res, err) => {
  MongoClient.connect(url, function (err, db) {
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

    var aggregation = [
      {
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

    db.collection('classes').aggregate(aggregation).limit(200).toArray(function (err, result) {
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

io.sockets.on('connection', function (socket) {
	// when the client emits 'adduser', this listens and executes
  socket.on('adduser', function (username, room) {
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
		// echo to client they've connected
    socket.emit('updatechat', 'SERVER-MSG', 'You have connected to ' + atob(room).split(':')[0])
		// echo to room 1 that a person has connected to their room
    socket.broadcast.to(room).emit('updatechat', 'SERVER-MSG', username + ' has connected to this room')
  })

	// when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', function (data) {
		// Sanitize input
    data = validator.escape(data)

    if (validator.unescape(data).includes('/meme ')) {
      io.sockets.in(socket.room).emit('updatechat', 'SERVER-MEME', validator.unescape(data).split('/meme ')[1])
      return
    }

		// we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.in(socket.room).emit('updatechat', socket.username, data)
  })

  socket.on('switchRoom', function (newroom) {
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
  socket.on('disconnect', function () {
		// remove the username from global usernames list
    delete usernames[socket.username]
		// update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames)
		// echo globally that this client has left
    socket.broadcast.to(socket.room).emit('updatechat', 'SERVER-MSG', socket.username + ' has disconnected')
    socket.leave(socket.room)
  })
})

function atob (str) {
  return Buffer.from(str, 'base64').toString('ascii')
}

function btoa (str) {
  return Buffer.from(str).toString('base64')
}
