# -*- coding: utf-8 -*-

import base64
import hashlib
import random
import string
import sys
import time

from flask import Flask
from flask import jsonify
from flask import make_response
from flask import render_template

app = Flask(__name__)

dictionary = {}
sessions = {}
puzzles = []

def random_value(size):
    return ''.join([random.choice(string.ascii_lowercase + string.digits) for i in range(size)])

@app.route("/solution/<session_id>")
def solution(session_id):
    result = {}
    timestamp = time.time()

    if session_id not in sessions:
        result["success"] = False
        return jsonify(result)

    session = sessions[session_id]

    # Magic value, move to config
    if timestamp - session["timestamp"] < 120.0:
        result["success"] = False
        return jsonify(result)

    result["success"] = True
    result["solution"] = session["solution"]

    # Remove used session
    del sessions[session_id]

    return jsonify(result)

@app.route("/puzzle/<session_id>")
def puzzle(session_id):

    response = {}

    if session_id not in sessions:
        response["success"] = False
        return jsonify(result)

    # Initialize puzzle start timestamp
    sessions[session_id]["timestamp"] = time.time()

    session = sessions[session_id]

    response["success"] = True
    response["salt"] = session["salt"]
    response["hashes"] = session["hashes"]
    
    return jsonify(response)

@app.route("/")
def index():

    # Should be a parameter
    grid_size = 3

    # Select random puzzle
    (puzzle, _score, solutions) = random.choice(puzzles)

    # Create salt and hashes
    salt = random_value(32)
    hashed_solutions = []
    md5 = hashlib.md5(salt)
    for solution in solutions:
        m = md5.copy()
        m.update(solution.encode("utf-8"))
        hash = m.hexdigest()
        hashed_solutions.append(hash)


    # Create new session
    session_id = random_value(32)
    sessions[session_id] = {
        "timestamp": 0,
        "puzzle": puzzle,
        "solution": solutions,
        "hashes": hashed_solutions,
        "salt": salt
    }

    # Render template
    render = render_template("index.html", word=puzzle)
    
    resp = make_response(render)
    resp.set_cookie("session", session_id)

    return resp


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
            # Evaluate the tuple
            puzzle = eval(puzzle)

            # Decode utf-8
            (a, b, c) = puzzle
            c = [x.decode("utf-8") for x in c]
            puzzle = (a.decode("utf-8"), b, c)

            puzzles.append(puzzle)

    # Start web server
    app.run(host="0.0.0.0", port=5000, debug=True)