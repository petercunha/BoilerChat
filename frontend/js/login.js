$(document).ready(function() {

    // Handle enter button click
    $('#search').keyup(function(e) {
        var input = $('#search').val()

        // Animate when input is first entered
        if (input == '') {
            $('#tablediv').hide('slow')
        } else {
            $('#tablediv').show('slow')
        }

        if (input.includes(' ') && input.split(' ').length == 2) {
            input = input.split(' ')
            if (input[0].length > 0 && input[1].length > 0) {
                populateTable(input[0], input[1])
            }
        } else {
            var course_data = ""
            course_data += '<tr>'
            course_data += '<td>No class with by that ID. Try again with the format "<b>CS 180</b>".</td>'
            course_data += '</tr>'
            $('#course_list').empty()
            $('#course_list').append(course_data)
        }
    })

    // Populate table with API response
    function populateTable(course, id) {
        // Map to keep track of and prevent adding duplicate objects to the table
        var map = {}

        $.get(`/api/${course}/${id}`, function(data, status) {

            // Table buffer
            var course_data = ""

            if (data.length == 0) {
                course_data += '<tr>'
                course_data += '<td>No class with by that ID. Try again with the format "<b>CS 180</b>".</td>'
                course_data += '</tr>'
            }

            for (var i = 0; i < data.length; i++) {
                var json = data[i]

                // Validate the JSON object. Sometimes we have issues with corrupted data.
                {
                  let temp = json.Courses.Classes.Sections
                  if (temp.Meetings.length == 0) continue
                  if (temp.Meetings[0].Instructors.length == 0) continue
                  if (!temp.Meetings[0].Instructors[0].Name) continue
                  if (!json.Abbreviation || !json.Courses) continue
                }

                // Grab relevant data from API response
                let classID = json.Abbreviation + " " + json.Courses.Number
                let className = json.Courses.Title
                let classInstructor = json.Courses.Classes.Sections.Meetings[0].Instructors[0].Name

                // Base64 encode relevant data
                let url = btoa(classID + ':' + className + ':' + classInstructor)

                // Don't add duplicates to the table
                if (url in map) {
                    continue
                }
                // Track the object hash to prevent duplicates
                map[url] = 1;

                // Add table data to buffer
                course_data += '<tr>'
                course_data += '<td>' + classID + '</td>'
                course_data += '<td>' + className + '</td>'
                course_data += '<td>' + classInstructor + '</td>'
                course_data += '<td><a href="/chat/' + url + '" type="button" class="btn btn-primary btn-sm">Join Chat</></td>'
                course_data += '</tr>'
            }

            $('#course_list').empty()
            $('#course_list').append(course_data)

        })
    }
})
