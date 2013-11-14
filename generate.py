import dataset
import json
import random
import sys

dictionary = {}

def word_lookup(word):
    start = 0
    end = len(dictionary[len(word)])

    while start < end:
        pivot = (start + end) // 2
        
        if word == dictionary[len(word)][pivot]:
            return True
        elif word < dictionary[len(word)][pivot]:
            end = pivot - 1
        else:
            start = pivot + 1

    if start >= len(dictionary[len(word)]):
        return False

    return word == dictionary[len(word)][start]

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
    word = u""
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

def find_grid(grid_size, score_limit):
    
    grid = []
    score = 0

    # Iterate until desired score is reached
    while score < score_limit:

        # Select random word
        word = random.choice(dictionary[grid_size ** 2])
        
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

    if len(sys.argv) < 4:
        print "Usage: %s <grid_size> <score_limit> <amount>" % sys.argv[0]
        sys.exit(0)

    # Initialize dictionary
    with open("wordlist/wordlist", "rb") as fp:
        data = fp.read().split("\n")

        for word in data:
            word_utf8 = word.decode("utf-8")

            if len(word_utf8) not in dictionary:
                dictionary[len(word_utf8)] = []
            dictionary[len(word_utf8)].append(word_utf8)

    grid_size = int(sys.argv[1])
    score_limit = int(sys.argv[2])
    amount = int(sys.argv[3])

    db = dataset.connect('sqlite:///liwords.db')
    table = db["puzzle"]

    for i in range(amount):
        (grid, score, solution_set) = find_grid(grid_size, score_limit)

        puzzle = unicode(''.join(grid))
        solution = [unicode(s) for s in solution_set]

        result = {
            "puzzle": puzzle,
            "score": score,
            "solution": json.dumps(solution)
        }

        table.insert(result)

if __name__ == "__main__":

    main()