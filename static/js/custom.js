var gameOver = false;
var time = 120;
var score = 0;
var puzzleObj = {};
var currentWord = "", oldWord = "";
var visited = [];
var foundWords = [];

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
  return currentWord;
}

var setWord = function(newWord) {
  currentWord = newWord;
  $('#liw-word-actual').text(currentWord);
}

var resetWord = function() {
  
  /*
   * Test if the word is correct before removing it
   */
  if (currentWord.length >= 3) {
    oldWord = currentWord;
    $('#liw-word-actual-overlay').text("");
    $('#liw-word-actual-overlay').show();
    $('#liw-word-actual-overlay').text(oldWord);
    
    if (checkCorrect(currentWord.toLowerCase())) {
      // Word is correct
      if (foundWords.indexOf(currentWord) < 0) {
        foundWords.push(currentWord);
        score++;
        $(".liw-score-points").text(score);
      }

      $('#liw-word-actual-overlay').removeClass("liw-fail");
      $('#liw-word-actual-overlay').addClass("liw-success");
    } else {
      $('#liw-word-actual-overlay').removeClass("liw-success");
      $('#liw-word-actual-overlay').addClass("liw-fail");
    }

    $('#liw-word-actual-overlay').fadeOut("slow");
  }

  currentWord = "";
  $('#liw-word-actual').text(currentWord);
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

var checkCorrect = function(word) {
  var hash = hex_md5(puzzleObj.salt + word)

  if (puzzleObj.hashes.indexOf(hash) != -1) {
    return true;
  }

  return false;
}

/*
 * jQuery entry-point
 */
$(function() {

  var mouseDown = false;

  // Get puzzle details
  var puzzleUrl = "/puzzle/" + $.cookie("session");
  $.get(puzzleUrl, function(data) {
    if (data.success) {
      puzzleObj = data;

      // Set max score
      $(".liw-score-max").text("/" + puzzleObj.hashes.length)
    }
  });

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

  // Timer countdown
  countDown = setInterval(function() {
    time--;
    $(".liw-timer-seconds").text(time);

    if (time == 0) {
      gameOver = true;

      // Remove handlers
      $('.liw-box-inner').unbind("mousedown");
      $('.liw-box-inner').unbind("mouseover");

      clearInterval(countDown);
    }
  }, 1000);

});