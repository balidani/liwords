import base64
import dataset
import hashlib
import json
import random
import string
import sys
import time

from flask import Flask
from flask import jsonify
from flask import make_response
from flask import render_template
from flask import request

app = Flask(__name__)

db = None
sessions = {}
puzzles = []
language = {}

def random_value(size):
    'Generate a random string with length `size`'
    return ''.join([random.choice(string.ascii_letters + string.digits) for i in range(size)])

@app.route('/solution/<session_id>')
def solution(session_id):
    'Return the solution for a session if the time elapsed'
    result = {}
    timestamp = time.time()

    if session_id not in sessions:
        result['success'] = False
        return jsonify(result)

    session = sessions[session_id]


    # This check will not be needed when the final evaluation is on the host side 
    #
    # if timestamp - session['timestamp'] < float(session['time']):
    #     result['success'] = False
    #     return jsonify(result)

    result['success'] = True
    result['solution'] = session['solution']

    # Remove used session
    del sessions[session_id]

    return jsonify(result)


@app.route('/puzzle/<int:game_length>')
def puzzle(game_length):
    'Create a new session with a random puzzle'

    response = {}

    # Select random puzzle
    puzzle = random.choice(puzzles)

    # Create salt and hashes
    hashed_solutions = []
    salt = random_value(32)
    md5 = hashlib.md5(salt)

    for solution in puzzle['solution']:
        m = md5.copy()
        m.update(solution.encode('utf-8'))
        hashed_solutions.append(m.hexdigest())

    # Create new session
    session_id = random_value(16)
    session = {
        'timestamp': time.time(),
        'time': int(game_length),
        'puzzle': puzzle['puzzle'],
        'solution': puzzle['solution'],
        'hashes': hashed_solutions,
        'salt': salt
    }

    sessions[session_id] = session

    # Compute the maximal score for the puzzle
    max_score = sum([len(x) - 2 for x in puzzle['solution']])

    response['success'] = True
    response['session_id'] = session_id
    response['puzzle'] = session['puzzle']
    response['hashes'] = session['hashes']
    response['salt'] = session['salt']
    response['time'] = session['time']
    response['max_score'] = max_score
    
    return jsonify(response)


@app.route('/remove/<word>')
def remove(word):
    'Vote for the removal of a word in the database'

    client_id = hashlib.md5(random_salt + request.remote_addr).hexdigest()

    word_id = db['words'].find_one(word=word)['id']

    reports = db['word_reports']
    reports.insert({
        'client': client_id,
        'word': word,
        'word_id': word_id
    })

    return jsonify({'success': True})

@app.route('/undo_remove/<word>')
def undo_remove(word):
    'Remove the vote for the removal of a word in the database'

    client_id = hashlib.md5(random_salt + request.remote_addr).hexdigest()

    reports = db['word_reports']
    
    if reports.find_one(word=word, client=client_id) is None:
        return jsonify({'success': False})    
    else:
        reports.delete(word=word, client=client_id)

    return jsonify({'success': True})

def admin_auth(password):
    'Authenticate the admin user'

    # Validate password
    # Password is '7edb760188843cf36a8941c0a90c9c51'
    # TODO: implement actual authentication
    return hashlib.md5(password).hexdigest() == '7bec669f4e754cf24ad3dc063b3a30b9'

@app.route('/admin/<password>')
def admin(password):
    'Present the administration panel'

    # Authenticate
    valid = admin_auth(password)

    # Get data from the database
    query_result = list(db.query("SELECT word_id, word, COUNT(client) AS count FROM word_reports GROUP BY word_id, word"))

    # Render template
    render = render_template('admin.html', l=language['admin'], auth=valid, data=query_result)
    resp = make_response(render)

    return resp

@app.route('/admin/<password>/remove/<word_id>')
def admin_remove(password, word_id):
    'Disable the word in the db, flagging it for final removal'

    # Authenticate
    valid = admin_auth(password)

    # Set enabled to false
    data = dict(id=word_id, enabled=0)
    db['words'].update(data, ['id'])

    # Remove from reports
    db['word_reports'].delete(word_id=word_id)

    return jsonify({'success': True})

@app.route('/')
def index():

    # Render template
    render = render_template('index.html', l=language['index'])
    resp = make_response(render)

    return resp

if __name__ == '__main__':

    # Connect to database
    db = dataset.connect('sqlite:///liwords.db')

    # Generate salt
    random_salt = random_value(32)

    # Initialize puzzles
    for puzzle in db['puzzles']:
        puzzle['solution'] = json.loads(puzzle['solution'])
        puzzles.append(puzzle)

    # Load the language file
    if len(sys.argv) < 2:
        lang_file = 'lang.json'
    else:
        lang_file = sys.argv[1]

    with open(lang_file, 'rb') as fp:
        language = json.loads(fp.read())

    # Start web server
    app.run(host='0.0.0.0', port=5000, debug=True)