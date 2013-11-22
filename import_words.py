import argparse
import dataset
import sys

def main():

    # Parse arguments
    parser = argparse.ArgumentParser(description='Import words to the database')
    parser.add_argument('-c', dest='command', metavar='Cmd', default='import', 
        help='Command to execute (import or clear)')
    parser.add_argument('-w', '--wordlist', metavar='File', required=True, 
        help='File containing the words (one on each line)')

    args = vars(parser.parse_args())

    # Connect to database
    db = dataset.connect("sqlite:///liwords.db")
    words = db['words']

    command = args['command']
    wordlist = args['wordlist']

    # Process command
    if command == 'clear':
        
        words.delete()
        print 'Table cleared successfully'

    elif command == 'import':

        if len(sys.argv) < 3:
            usage()

        results = []
        count = 0

        with open(wordlist, 'rb') as fp:
            data = fp.read().split('\n')

            for word in data:

                word_utf8 = word.decode('utf-8')
                results.append({'word': word_utf8, 'length': len(word_utf8), 'enabled': True})
                count += 1

        words.insert_many(results)
        print "%d words inserted successfully" % count

if __name__ == '__main__':
    main()