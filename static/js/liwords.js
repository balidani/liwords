var puzzleObj = {};
var currentWord = "", oldWord = "";
var visited = [];
var foundWords = [];
var score = 0, time = 0;
var gameOn = false;

// TODO: Eliminate magic value
var gridSize = 3;


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

      // Fix me: TypeError: Cannot call method 'text' of undefined 
      // Happens when selecting one letter, leaving the container and hovering back

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

/*
 * Display the puzzle
 */
var displayPuzzle = function(puzzle) {

  // Display puzzle on the grid
  var children = $(".liw-container > .liw-box-outer").children();
  for (var i = 0; i < children.length; ++i) {
    $(children[i]).text(puzzle.charAt(i));
  }

}

/*
 * Shuffle the puzzle
 */
var shuffleGrid = function() {

  var originalPuzzle = puzzleObj.puzzle;
  var grid = Array(gridSize);

  for (var i = 0; i < grid.length; ++i) {
    grid[i] = originalPuzzle.substr(i * gridSize, gridSize).split("");
  }

  // Rotate array
  var rotateGrid = function(grid) {

    var gridCopy = Array(gridSize);

    for (var i = 0; i < gridSize; ++i) {
      
      gridCopy[i] = Array(gridSize);

      for (var j = 0; j < gridSize; ++j) {
        gridCopy[i][gridSize - (j+1)] = grid[j][i];
      }
    }

    return gridCopy;
  }

  // Mirror array
  var mirrorGrid = function(grid, mirrorX, mirrorY) {

    var gridCopy = Array(gridSize);

    for (var i = 0; i < gridSize; ++i) {

      var yCoord = mirrorY ? (gridSize - (i+1)) : i;
      gridCopy[i] = grid[yCoord].slice();

      if (!mirrorX) continue;

      for (var j = 0; j < gridSize; ++j) {
        gridCopy[i].reverse();
      }
    }

    return gridCopy;
  }

  // Rotate random number of times (0 - 3)
  for (var i = 0; i < Math.random() * 4; ++i) {
    grid = rotateGrid(grid);
  }

  // Mirror randomly
  grid = mirrorGrid(grid, Math.random() < 0.5, Math.random() < 0.5);

  // Create puzzle string
  var newPuzzle = "";
  for (var i = 0; i < gridSize; ++i) {
    newPuzzle += grid[i].join("");
  }

  puzzleObj.puzzle = newPuzzle;
  displayPuzzle(puzzleObj.puzzle);
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

  var gameLength = 120;
  var gameLengthStr = $("#liw-game-length").val();

  if (gameLengthStr != "") {
    gameLength = 60 * parseFloat(gameLengthStr);
  }

  var url = "/puzzle/" + parseInt(gameLength);

  // Get puzzle details
  $.get(url, function(data) {
    if (data.success) {
      puzzleObj = data;

      // Set puzzle time and reset score
      time = puzzleObj.time;

      score = 0;
      $(".liw-score-points").text(score);

      // Set max score
      $(".liw-score-max").text("/" + puzzleObj.hashes.length);

      // Hide possible previous solutions
      $(".liw-word-solutions").empty();

      // Hide pre-game buttons
      // Show post-game buttons
      $(".liw-pre-game").fadeOut("medium", function() {
        $(".liw-post-game").fadeIn();
      });

      displayPuzzle(puzzleObj.puzzle);
      gameOn = true;

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

  // Disable handlers
  gameOn = false;
  
  // TODO: move time handling (and display) to functions
  time = 0;
  $(".liw-timer-seconds").text(time);

  clearInterval(countDown);

  // Retrieve solutions
  var solutionUrl = "/solution/" + puzzleObj.session_id;
  $.get(solutionUrl, function(data) {
    if (data.success) {
      displaySolution(data.solution);

      // Hide post-game buttons
      // Show pre-game buttons
      $(".liw-post-game").fadeOut("medium", function() {
        $(".liw-pre-game").fadeIn();
      });

    } else {
      gameOver();
    }
  });
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
    if (gameOn)
      return;

    gameStart();
  });

  // Stop button handler
  $("#liw-stop-button").click(function(e) {
    if (!gameOn)
      return;

    gameOver();
  });

  // Shuffle button handler
  $("#liw-shuffle-button").click(function(e) {
    if (!gameOn)
      return;

    shuffleGrid();
  });

  // This is to disable text selection
  $(".liw-container").mousedown(function(e) {
    return false;
  });

  // Mouse down handler
  $(".liw-box-inner").mousedown(function(e) {

    if(e.which === 1) mouseDown = true;

    if (!gameOn)
      return false;

    if (getWord() == "")
      addLetter($(this));

    return false;
  });

  // Mouse over handler
  $(".liw-box-inner").mouseover(function(e) {
    
    if (!gameOn)
      return false;

    if (!mouseDown)
      return false;

    addLetter($(this));

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