$(document).ready(function () {
  start()
})

function start () {
  var fullURL = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '')
  var socket = io.connect(fullURL)
  var lastMessageUsername = ''
  var user

  var uri = document.location.pathname
  var lastslashindex = uri.lastIndexOf('/')
  var resultEncoded = uri.substring(lastslashindex + 1)
  var result = atob(resultEncoded)

  $('#lecturename').text(result.split(':')[0])
  $('#lectureprofessor').text(result.split(':')[2])

  // Handle connection to socket server
  socket.on('connect', function () {
    user = nameGenerator()
    socket.emit('adduser', user, resultEncoded)
    $('#nametag').text(result.split(':')[0] + ' · ' + result.split(':')[2])
  })

	// Listener, whenever the server emits 'updatechat', this updates the chat body
  socket.on('updatechat', function (username, data) {
		// Handle messages from the chatserver
    if (username === 'SERVER-MSG') {
      iziToast.show({
        theme: 'dark',
        icon: 'icon-person',
        title: 'Success',
        message: data,
        position: 'topCenter', // bottomRight, bottomLeft, topRight, topLeft, topCenter, bottomCenter
        progressBarColor: 'rgb(0, 255, 184)',
        timeout: 1900
      })
      return
    }

		// If the last message was from the same user, don't prepend their username
    var label = ''
    if (lastMessageUsername !== username) {
      label = `<label>${username}</label></br>`
    }
    lastMessageUsername = username

		// Append message to conversation
    if (user === username) {
      $('#conversation').append(`
	        <li class="user">
							${label}
	            <p>${data}</p>
	        </li>
	        `)
    } else {
      $('#conversation').append(`
	        <li>
	            ${label}
	            <p>${data}</p>
	        </li>
	        `)
    }

    var chatbox = document.getElementById('conversation')
    chatbox.scrollTop = chatbox.scrollHeight
  })

	// On load of page
  $(function () {
		// When the client clicks SEND
    $('#datasend').click(function () {
      var message = $('#data').val()

			// Prevent bad input
      if (message.length === 0) return false
      if (message.length > 500) {
        iziToast.warning({
          title: 'Error',
          message: 'Your message was too long. The maximum length is 500 characters.',
          position: 'topCenter',
          timeout: 1900
        })
        return false
      }

      $('#data').val('')
      socket.emit('sendchat', message)
    })

		// When the client hits ENTER on their keyboard
    $('#data').keypress(function (e) {
      if (e.which === 13) {
        $(this).blur()
        $('#datasend').focus().click()
        $(this).focus()
      }
    })

    var chatbox = document.getElementById('conversation')
    chatbox.scrollTop = chatbox.scrollHeight
  })

  $('input, select, textarea').on('focus blur', function (event) {
    $('meta[name=viewport]').attr('content', 'width=device-width,initial-scale=1,maximum-scale=' + (event.type === 'blur' ? 10 : 1))
  })

  function nameGenerator () {
    var animals = ['Alligator', 'Purdue Pete', 'Anteater', 'Armadillo', 'Badger', 'Bat', 'Beaver', 'Buffalo', 'Camel', 'Chameleon', 'Cheetah', 'Chipmunk', 'Chinchilla', 'Chupacabra', 'Dingus', 'Coyote', 'Crow', 'Dingo', 'Dinosaur', 'Dolphin', 'Duck', 'Elephant', 'Ferret', 'Fox', 'Frog', 'Giraffe', 'Gopher', 'Grizzly', 'Hedgehog', 'Hippo', 'Hyena', 'Jackal', 'Ibex', 'Iguana', 'Koala', 'Kraken', 'Lemur', 'Leopard', 'Liger', 'Llama', 'Manatee', 'Mink', 'Monkey', 'Narwhal', 'Orangutan', 'Otter', 'Panda', 'Penguin', 'Platypus', 'Python', 'Pumpkin', 'Sea Cucumber', 'Rabbit', 'Raccoon', 'Rhino', 'Sheep', 'Shrew', 'Skunk', 'Squirrel', 'Turtle', 'Walrus', 'Wolf', 'Wolverine', 'Wombat', 'Tuna']
    var adjectives = ['Adorable', 'Beautiful', 'Clean', 'Drab', 'Elegant', 'Fancy', 'Glamorous', 'Handsome', 'Long', 'Magnificent', 'Old-fashioned', 'Plain', 'Quaint', 'Sparkling', 'Ugliest', 'Unsightly', 'Wide-eyed', 'Alive', 'Better', 'Careful', 'Clever', 'Dead', 'Easy', 'Famous', 'Gifted', 'Helpful', 'Important', 'Inexpensive', 'Mushy', 'Odd', 'Powerful', 'Rich', 'Shy', 'Tender', 'Uninterested', 'Vast', 'Wrong', 'Agreeable', 'Brave', 'Calm', 'Delightful', 'Eager', 'Faithful', 'Gentle', 'Happy', 'Jolly', 'Kind', 'Lively', 'Nice', 'Obedient', 'Proud', 'Relieved', 'Silly', 'Thankful', 'Victorious', 'Witty', 'Zealous', 'Angry', 'Wild', 'Bewildered', 'Clumsy', 'Defeated', 'Embarrassed', 'Fierce', 'Grumpy', 'Helpless', 'Itchy', 'Jealous', 'Lazy', 'Mysterious', 'Nervous', 'Obnoxious', 'Panicky', 'Repulsive', 'Scary', 'Thoughtless', 'Uptight', 'Worried', 'Broad', 'Chubby', 'Crooked', 'Curved', 'Deep', 'Flat', 'High', 'Hollow', 'Low', 'Narrow', 'Round', 'Shallow', 'Skinny', 'Square', 'Steep', 'Dynamic', 'Wide', 'Big', 'Glorious', 'Colossal', 'Fat', 'Gigantic', 'Great', 'Huge', 'Immense', 'Large', 'Little', 'Perturbed', 'Mammoth', 'Massive', 'Miniature', 'Petite', 'Puny', 'Scrawny', 'Short', 'Small', 'Tall', 'Teeny', 'Teeny-tiny', 'Tiny', 'Cooing', 'Deafening', 'Faint', 'Hissing', 'Loud', 'Melodic', 'Noisy', 'Purring', 'Quiet', 'Raspy', 'Screeching', 'Thundering', 'Voiceless', 'Whispering', 'Ancient', 'Brief', 'Early', 'Fast', 'Late', 'Long', 'Modern', 'Old', 'Old-fashioned', 'Quick', 'Rapid', 'Short', 'Slow', 'Swift', 'Young', 'Bitter', 'Delicious', 'Fresh', 'Greasy', 'Juicy', 'Hot', 'Icy', 'Loose', 'Melted', 'Nutritious', 'Prickly', 'Rainy', 'Rotten', 'Salty', 'Sticky', 'Strong', 'Sweet', 'Tart', 'Tasteless', 'Uneven', 'Weak', 'Wet', 'Wooden', 'Yummy', 'Boiling', 'Breeze', 'Broken', 'Bumpy', 'Chilly', 'Cold', 'Cool', 'Creepy', 'Crooked', 'Cuddly', 'Curly', 'Damaged', 'Damp', 'Dirty', 'Dry', 'Dusty', 'Filthy', 'Flaky', 'Fluffy', 'Freezing', 'Hot', 'Warm', 'Wet', 'Abundant', 'Empty', 'Few', 'Full', 'Heavy', 'Light', 'Many', 'Numerous', 'Sparse', 'Substantial']
    var animal = animals[Math.floor(Math.random() * animals.length)]
    var adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    return adjective + ' ' + animal
  }
}
