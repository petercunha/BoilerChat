$('#Courses .typeahead_Course').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
},
{
  name: 'courses',
  source: function(query, syncResults, asyncResults) {
      $.get('http://localhost:8080/api/' + query).done(function(data) {
          for (var i = 0; i < data.length; i++) {
            asyncResults(data)
          }
      })
  }
})