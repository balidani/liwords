var gameOn = false;

// Puzzle details
var puzzleObj = {};

// Word formation mechanics
var currentWord = "", oldWord = "";
var visited = [];

// Statistics details
var foundWords = [];
var score = 0;
var time = 0;

// Word moderation
var lastRemoved = null;

// TODO: Eliminate magic value
var gridSize = 3;


/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  Functions that handle letter box display                                 *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var setSelected = function(letterObj) {
  var letterParent = letterObj.parent();

  letterParent.addClass("liw-cell-selected");
}

var unsetSelected = function(letterObj) {
  var letterParent = letterObj.parent();
  
  letterParent.removeClass("liw-cell-selected");
}

var toggleSelected = function(letterObj) {
  var letterParent = letterObj.parent();
  
  if (letterParent.hasClass("liw-cell-selected")) {
    unsetSelected(letterObj);
  } else {
    setSelected(letterObj);
  }
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  Functions that handle time and score display                             *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var setTime = function(value) {
  time = value;
  $("#liw-time-value").text(time);
}

var decTime = function() {
  setTime(time - 1);
}

var getTime = function() {
  return time;
}

var addScore = function(word) {
  score += word.length - 2;
  $("#liw-score-value").text(Math.round(100 * score / puzzleObj.max_score));
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
  $("#liw-word-real").text(currentWord);
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

  // TODO: rewrite this with CSS classes

  var failColor = "#e24";
  var seenColor = "#fe2";
  var successColor = "#3e6";

  if (currentWord.length >= 3) {
    oldWord = currentWord;
    $("#liw-word-result").text("");
    $("#liw-word-result").text(oldWord);
    if (checkHash(currentWord)) {
      // Word is correct
      if (foundWords.indexOf(currentWord) < 0) {
        foundWords.push(currentWord);

        addScore(currentWord);

        $("#liw-words-found").text(foundWords.length);
        $("#liw-word-result").css("color", successColor);
      
      } else {
        // Word has already been found
        $("#liw-word-result").css("color", seenColor);
      }

    } else {
      $("#liw-word-result").css("color", failColor);
    }

    $("#liw-word-result").show();
    $("#liw-word-result").fadeOut("slow");
  }

}

/*
 * Reset the current word
 */
var resetWord = function() {
  
  //Test if the word is correct before removing it
  checkWord();

  currentWord = "";
  $("#liw-word-real").text(currentWord);
  $(".liw-cell-outer").removeClass("liw-cell-selected");
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
    if (currentParent.hasClass("liw-cell-selected")) {

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
    
    var solutionSpan = $("<span/>").append(
      $("<span/>").append(solutions[i])
    ).append(" ×");

    solutionSpan.addClass("liw-solution-box");

    // Add class according to successful find
    if (foundWords.indexOf(solutions[i]) < 0) {
      solutionSpan.addClass("liw-solution-missed");
    } else {
      solutionSpan.addClass("liw-solution-found");
    }

    // Add click event
    solutionSpan.click(function (e) {
      var word = $(this).children().eq(0).text();
      $("#liw-alert-removed-word").text(word);

      if (removeWord(word, false)) {
        lastRemoved = $(this);
        $(this).fadeOut();
      }

      $(".liw-alert").fadeIn();
    });

    $(".liw-solutions").append(solutionSpan);
  }

  // Vertically align solutions to the bottom
  var padding = $(".liw-solution-container").innerHeight() - $(".liw-solutions").innerHeight();
  $(".liw-solution-container").css({top: padding});

  $(".liw-solutions").fadeIn();

}

/*
 * Display the puzzle
 */
var displayPuzzle = function(puzzle) {

  // Display puzzle on the grid
  var children = $(".liw-grid > .liw-cell-outer").children();
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
 * Request the removal of a word
 */
var removeWord = function(word, undo) {
  var success = false;
  var url = undo ? "/undo_remove/" : "/remove/";
  url += word;


  $.ajax({
    url: url,
    async: false,
    success: function(data) {
      if (data.success) {
        success = true;
      }
    }
  });

  return success;
}

/*
 * Get a puzzle, display it and start the timer
 */
var gameStart = function() {

  var gameLength = 120;
  var gameLengthStr = $("#liw-game-length").val();

  gameOn = true;

  if (gameLengthStr != "") {
    gameLength = 60 * parseFloat(gameLengthStr);
  }

  var url = "/puzzle/" + parseInt(gameLength);

  // Get puzzle details
  $.get(url, function(data) {
    if (data.success) {
      puzzleObj = data;

      // Set puzzle time and reset score
      setTime(puzzleObj.time);

      score = 0;
      foundWords = [];

      $("#liw-words-found").text(foundWords.length);
      $("#liw-score-value").text(score);

      // Set max words
      $("#liw-words-max").text(puzzleObj.hashes.length);

      // Hide possible previous solutions
      $(".liw-solutions").empty();

      $(".liw-alert").fadeOut();

      // Hide pre-game buttons
      // Show post-game buttons
      $(".liw-pre-game").fadeOut("medium", function() {
        $(".liw-post-game").fadeIn();
      });

      displayPuzzle(puzzleObj.puzzle);

      // Start timer
      countDown = setInterval(gameTimer, 1000);
    }
  });
}

/*
 * Timer event
 */
var gameTimer = function() {
  decTime();

  if (getTime() == 0)
    gameOver();
}

/*
 * Handle the end of the game
 */
var gameOver = function() {

  // Disable handlers
  gameOn = false;
  setTime(0);

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

  // Word removal undo handler
  $("#liw-alert-undo").click(function(e) {
    if (lastRemoved == null)
      return;

    if (removeWord($("#liw-alert-removed-word").text(), true)) {
      lastRemoved.fadeIn();
      $(".liw-alert").fadeOut();
    }
  });

  // Alert hide handler
  $("#liw-alert-x").click(function(e) {
    $(".liw-alert").fadeOut();
  });

  // This is to disable text selection
  $(".liw-grid").mousedown(function(e) {
    return false;
  });

  // Mouse down handler
  $(".liw-cell-inner").mousedown(function(e) {

    if(e.which === 1) mouseDown = true;

    if (!gameOn)
      return false;

    if (getWord() == "")
      addLetter($(this));

    return false;
  });

  // Mouse over handler
  $(".liw-cell-inner").mouseover(function(e) {
    
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