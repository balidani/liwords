var puzzleObj = {};
var currentWord = "", oldWord = "";
var visited = [];
var foundWords = [];
var score = 0, time = 0;


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  Functions that handle letter box display                                 *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  Functions that handle word formation and display                         *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var getWord = function() {
  return currentWord;
}

var setWord = function(newWord) {
  currentWord = newWord;
  $("#liw-word-actual").text(currentWord);
}

/*
 * Check if a supplied word is correct
 */
var checkHash = function(word) {
  var hash = hex_md5(puzzleObj.salt + word)

  if (puzzleObj.hashes.indexOf(hash) != -1) {
    return true;
  }

  return false;
}

/*
 * Check if a word is correct and handle the display of success/failure
 */
var checkWord = function() {

  var failColor = "#e24";
  var seenColor = "#fe2";
  var successColor = "#3e6";

  if (currentWord.length >= 3) {
    oldWord = currentWord;
    $("#liw-word-actual-overlay").text("");
    $("#liw-word-actual-overlay").text(oldWord);
    if (checkHash(currentWord)) {
      // Word is correct
      if (foundWords.indexOf(currentWord) < 0) {
        foundWords.push(currentWord);

        score++;
        $(".liw-score-points").text(score);
        $("#liw-word-actual-overlay").css("color", successColor);
      
      } else {
        // Word has already been found
        $("#liw-word-actual-overlay").css("color", seenColor);
      }

    } else {
      $("#liw-word-actual-overlay").css("color", failColor);
    }

    $("#liw-word-actual-overlay").show();
    $("#liw-word-actual-overlay").fadeOut("slow");
  }

}

/*
 * Reset the current word
 */
var resetWord = function() {
  
  //Test if the word is correct before removing it
  checkWord();

  currentWord = "";
  $("#liw-word-actual").text(currentWord);
  $(".liw-box-outer").removeClass("liw-selected").addClass("liw-free");
  visited = [];
}

/*
 * Add a letter to the current word if it"s a legal move and siplay it
 */
var addLetter = function(letterObj) {
  
  var lastVisited = visited[visited.length - 1];

  // Only check these after the first letter was selected
  if (typeof lastVisited != "undefined") {

    var lastParent = lastVisited.parent();
    var currentParent = letterObj.parent();

    // Check if it"s already selected
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
    var xDiff = parseInt(currentParent.data("x")) 
      - parseInt(lastParent.data("x"));
    var yDiff = parseInt(currentParent.data("y")) 
      - parseInt(lastParent.data("y"));
    
    if (Math.abs(xDiff) > 1 || Math.abs(yDiff) > 1)
      return;

  }

  setWord(getWord() + letterObj.text());
  toggleSelected(letterObj);

  visited.push(letterObj);
}

/*
 * Display the solution words above the grid
 */
var displaySolution = function(solutions) {

  for (var i = 0; i < solutions.length; ++i) {
    var solutionSpan = $("<span/>").text(solutions[i] + " ");

    // Add class according to successful find
    if (foundWords.indexOf(solutions[i]) < 0) {
      solutionSpan.addClass("liw-missed");
    } else {
      solutionSpan.addClass("liw-found");
    }

    $(".liw-word-solutions").append(solutionSpan);
  }

  $(".liw-word-solutions").fadeIn();

}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  Functions that handle puzzle events                                      *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/*
 * Get a puzzle, display it and start the timer
 */
var gameStart = function() {
  
  // Get puzzle details
  var puzzleUrl = "/puzzle/" + $.cookie("session");
  $.get(puzzleUrl, function(data) {
    if (data.success) {
      puzzleObj = data;

      // Set puzzle time
      time = puzzleObj.time;

      // Set max score
      $(".liw-score-max").text("/" + puzzleObj.hashes.length);

      // Display puzzle on the grid
      var children = $(".liw-container > .liw-box-outer").children();
      for (var i = 0; i < children.length; ++i) {
        $(children[i]).text(puzzleObj.puzzle.charAt(i));
      }

      // Start timer
      countDown = setInterval(gameTimer, 1000);
    }
  });
}

/*
 * Timer event
 */
var gameTimer = function() {
  time--;
  $(".liw-timer-seconds").text(time);

  if (time == 0)
    gameOver();
}

/*
 * Handle the end of the game
 */
var gameOver = function() {
  // Remove handlers
  $(".liw-box-inner").unbind("mousedown");
  $(".liw-box-inner").unbind("mouseover");

  // Retrieve solutions
  var solutionUrl = "/solution/" + $.cookie("session");
  $.get(solutionUrl, function(data) {
    if (data.success) {
      displaySolution(data.solution);
    } else {
      gameOver();
    }
  });

  clearInterval(countDown);
}


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  Main jQuery entry point                                                  *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$(function() {

  var mouseDown = false;

  // Start button handler
  $("#liw-start-button").click(function(e) {
    gameStart();
  });

  // Mouse down handler
  $(".liw-box-inner").mousedown(function(e) {
      if(e.which === 1) mouseDown = true;

    if (getWord() == "")
      addLetter($(this));

    return false;
  });

  // Mouse over handler
  $(".liw-box-inner").mouseover(function(e) {
    
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