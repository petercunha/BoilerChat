$(document).ready(function () {
    // Handle enter button click
  $('#search').keyup(function (e) {
    var input = $('#search').val()

        // Animate when input is first entered
    if (input === '') {
      $('#tablediv').hide('slow')
    } else {
      $('#tablediv').show('slow')
    }

    if (input.includes(' ') && input.split(' ').length === 2) {
      input = input.split(' ')
      if (input[0].length > 0 && input[1].length > 0) {
        populateTable(input[0], input[1])
      }
    } else {
      var courseData = ''
      courseData += '<tr>'
      courseData += '<td>No class with by that ID. Try again with the format "<b>CS 180</b>".</td>'
      courseData += '</tr>'
      $('#course_list').empty()
      $('#course_list').append(courseData)
    }
  })

    // Populate table with API response
  function populateTable (course, id) {
        // Map to keep track of and prevent adding duplicate objects to the table
    var map = {}

    $.get(`/api/${course}/${id}`, function (data, status) {
            // Table buffer
      var courseData = ''

      if (data.length === 0) {
        courseData += '<tr>'
        courseData += '<td>No class with by that ID. Try again with the format "<b>CS 180</b>".</td>'
        courseData += '</tr>'
      }

      for (var i = 0; i < data.length; i++) {
        var json = data[i]

                // Validate the JSON object. Sometimes we have issues with corrupted data.
        if (!json.Subject || !json.Number || !json.Title || !json.Instructor) continue

                // Grab relevant data from API response
        let classID = json.Subject + ' ' + json.Number
        let className = json.Title
        let classInstructor = json.Instructor

                // Base64 encode relevant data
        let url = btoa(classID + ':' + className + ':' + classInstructor)

                // Don't add duplicates to the table
        if (url in map) {
          continue
        }
                // Track the object hash to prevent duplicates
        map[url] = 1

                // Add table data to buffer
        courseData += '<tr>'
        courseData += '<td>' + classID + '</td>'
        courseData += '<td>' + className + '</td>'
        courseData += '<td>' + classInstructor + '</td>'
        courseData += '<td><a href="/chat/' + url + '" type="button" class="btn btn-primary btn-sm">Join Chat</></td>'
        courseData += '</tr>'
      }

      $('#course_list').empty()
      $('#course_list').append(courseData)
    })
  }
})
