import argparse
import bisect
import dataset
import json
import random
import sys

dictionary = {}

def binary_search(a, x, lo=0, hi=None):
    from bisect import bisect_left

    # http://stackoverflow.com/questions/212358/binary-search-in-python

    # hi defaults to len(a)
    hi = hi if hi is not None else len(a)

    # find insertion position
    pos = bisect_left(a, x, lo, hi)          
    
    # don't walk off the end
    return (True if pos != hi and a[pos] == x else False) 

def word_lookup(word):
    global dictionary

    return binary_search(dictionary[len(word)], word)

def create_grid(word, grid_size):
    
    grid = []
    for x in range(grid_size):
        grid.append(word[grid_size * x: grid_size * (x + 1)])

    return grid

def solve_grid(grid, grid_size, visited, x, y):

    # Check bounds and availability
    if x not in range(0, grid_size):
        return []

    if y not in range(0, grid_size):
        return []

    if (x, y) in visited:
        return []

    results = []

    # Create word
    word = u''
    for (i, j) in visited:
        word += grid[j][i]

    word += grid[y][x]

    if word_lookup(word):
        results.append(word)

    for i in range(-1, 2):
        for j in range(-1, 2):
            new_visited = visited + [(x, y)]
            new_words = solve_grid(grid, grid_size, new_visited, x+j, y+i)
            results += new_words

    return results

def generate_grid(grid_size, candidates):

    # Select random word
    word = random.choice(candidates)
    
    # Shuffle the letters
    word_list = list(word)
    random.shuffle(word_list)
    word = ''.join(word_list)

    # Create a grid
    grid = create_grid(word, grid_size)

    # Find every solution
    solutions = []
    for x in range(0, grid_size):
        for y in range(0, grid_size):
            solutions += solve_grid(grid, grid_size, [], x, y)

    # Calculate score
    solutions = set([x for x in solutions if len(x) >= 3])
    score = len(solutions)

    return (grid, score, solutions)

def main():
    global dictionary

    # Parse arguments
    parser = argparse.ArgumentParser(description='Generate new puzzles')
    parser.add_argument('-c', dest='command', metavar='Cmd', default='create', 
        help='Command to execute (create or clear)')
    parser.add_argument('-g', '--grid', metavar='Size', type=int, default=3, 
        help='Grid size')
    parser.add_argument('--min', metavar='Val', type=int, default=15, 
        help='Minimum word count')
    parser.add_argument('--max', metavar='Val', type=int, 
        help='Maximum word count')
    parser.add_argument('--amount', metavar='Val', type=int, default=1024, 
        help='Amount of puzzles to generate')
    parser.add_argument('--big-word', metavar='Length', type=int, 
        help='Have at least 1 long word, with the given size')
    parser.add_argument('-v', '--verbose', action='store_true', default=False,
        help='Verbose output')

    args = vars(parser.parse_args())

    # Connect to database
    db = dataset.connect('sqlite:///liwords.db')
    puzzles = db['puzzles']

    # Process command
    if args['command'] == 'clear':
        puzzles.delete()
        print 'Table cleared successfully'

    elif args['command'] == 'create':

        # Assign arguments
        amount = args['amount']
        min_score = args['min']
        max_score = args['max']
        grid_size = args['grid']
        verbose = args['verbose']
        big_word = args['big_word']

        # Load dictionary
        words = list(db['words'].find(enabled=True))
        words = [w['word'] for w in words]

        for word in words:
            if len(word) not in dictionary:
                dictionary[len(word)] = []

            dictionary[len(word)].append(word)

        # Fetch candidate words
        candidates = list(db['words'].find(length=(grid_size ** 2)))
        candidates = [w['word'] for w in candidates]

        found_puzzles = 0
        while found_puzzles < amount:

            (grid, score, solution_set) = generate_grid(grid_size, candidates)

            # Check minimum score
            if score < min_score:
                continue

            # Check maximum score
            if max_score is not None and score > max_score:
                continue

            # Convert solutions
            solution = [unicode(s) for s in solution_set]

            # Check 'big-word' property
            if big_word is not None:

                max_word = max([len(s) for s in solution])
                if max_word < big_word:
                    continue

            # Convert puzzle
            puzzle = unicode(''.join(grid))

            result = {
                'puzzle': puzzle,
                'score': score,
                'solution': json.dumps(solution)
            }


            found_puzzles += 1
            puzzles.insert(result)
            
            if verbose:
                print "%d. (%d -- %s)" % (found_puzzles, result['score'], result['puzzle'])

        print "%d puzzles inserted successfully" % amount

if __name__ == '__main__':
    main()