import random
import sys

from flask import Flask
from flask import render_template

app = Flask(__name__)
dictionary = {}
puzzles = []

@app.route("/")
def index():

    # Should be a parameter
    grid_size = 3

    # Select random word
    (puzzle, _score, _solutions) = random.choice(puzzles)

    # Render template
    return render_template("index.html", word=puzzle.upper())


if __name__ == "__main__":

    # Initialize dictionary
    with open("wordlist/wordlist", "rb") as fp:
        data = fp.read().split("\n")

        for word in data:
            word_utf8 = word.decode("utf-8")
            if len(word_utf8) not in dictionary:
                dictionary[len(word_utf8)] = []
            dictionary[len(word_utf8)].append(word_utf8)

    # Initialize puzzles
    with open("wordlist/puzzles", "rb") as fp:
        data = fp.read().strip().split("\n")

        for puzzle in data:
            puzzle = eval(puzzle)
            (a, b, c) = puzzle
            puzzle = (a.decode("utf-8"), b, c)
            puzzles.append(puzzle)

    # Start web server
    app.run(host="0.0.0.0", port=5000, debug=True)