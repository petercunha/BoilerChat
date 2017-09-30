var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};

var courses = ["CS18000--Turkstra","CS18000--Dunsmore"];

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
