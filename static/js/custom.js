var _word = "";
var visited = [];

/*
 * Functions that handle Letter selection
 */
var setSelected = function(letterObj) {
  var letterParent = letterObj.parent();
    
  letterParent.removeClass("liw-free");
  letterParent.addClass("liw-selected");
}

var unsetSelected = function(letterObj) {
  var letterParent = letterObj.parent();
  
  letterParent.removeClass("liw-selected");
  letterParent.addClass("liw-free");
}

var toggleSelected = function(letterObj) {
  var letterParent = letterObj.parent();
  
  if (letterParent.hasClass("liw-free")) {
    setSelected(letterObj);
  } else if (letterParent.hasClass("liw-selected")) {
    unsetSelected(letterObj);
  }
}

/*
 * Functions that handle word formation
 */

var getWord = function() {
  return _word;
}

var setWord = function(newWord) {
  _word = newWord;
  $('#liw-word-actual').text(_word);
}

var resetWord = function() {
  _word = "";
  $('#liw-word-actual').text(_word);
  $('.liw-box-outer').removeClass("liw-selected").addClass("liw-free");
  visited = [];
}

var addLetter = function(letterObj) {
  
  var lastVisited = visited[visited.length - 1];

  // Only check these after the first letter was selected
  if (typeof lastVisited != "undefined") {

    var lastParent = lastVisited.parent();
    var currentParent = letterObj.parent();

    // Check if it's already selected
    if (currentParent.hasClass("liw-selected")) {

      secondLastVisited = visited[visited.length - 2];

      // Backtrack
      if (letterObj.text() == secondLastVisited.text()) {
        unsetSelected(lastVisited);
        visited.pop();

        newWord = getWord().substr(0, getWord().length - 1);
        setWord(newWord);

      }

      return;
    }

    // Check if the letter is reachable
    var xDiff = parseInt(currentParent.data("x")) - parseInt(lastParent.data("x"));
    var yDiff = parseInt(currentParent.data("y")) - parseInt(lastParent.data("y"));
    
    if (Math.abs(xDiff) > 1 || Math.abs(yDiff) > 1)
      return;

  }

  setWord(getWord() + letterObj.text());
  toggleSelected(letterObj);

  visited.push(letterObj);
}

/*
 * jQuery entry-point
 */
$(function() {

  var mouseDown = false;

  // Mouse down handler
  $('.liw-box-inner').mousedown(function(e) {
      if(e.which === 1) mouseDown = true;

    if (getWord() == "")
      addLetter($(this));

    return false;
  });

  // Mouse over handler
  $('.liw-box-inner').mouseover(function(e) {
    
    if (!mouseDown)
      return;

    addLetter($(this));

    return false;
  });


  // This is to disable text selection
  $(".liw-container").mousedown(function(e) {
    return false;
  });

  // Keep track of mouseDown
  $(document).mousedown(function(e) {
      if(e.which === 1) mouseDown = true;
  }).mouseup(function(e) {
      if(e.which === 1) mouseDown = false;
      resetWord();
  });

});