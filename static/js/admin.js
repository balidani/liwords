/*
 * Request the final removal of a word
 */
var removeWord = function(href) {

  var result = false;

  $.ajax({
    url: href,
    success: function(data) {
      result = data.success;
    },
    async: false
  });

  console.log(result);
  return result;
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                                                                           *
 *  Main jQuery entry point                                                  *
 *                                                                           *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$(function() {

  // Start button handler
  $(".admin-remove").click(function(e) {
    if (removeWord($(this)[0].href)) {
      $(this).parent().parent().fadeOut();
    }
    e.preventDefault();
  });

});