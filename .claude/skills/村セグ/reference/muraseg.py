#!/usr/bin/python3
import math
import sys

def read_numbers_from_file_or_input(input_value):
    """
    Reads numbers from a file or directly from input.
    
    Args:
        input_value (str): The file path or a direct number input.
    
    Returns:
        list: A list of integers.
    """
    try:
        if input_value.endswith('.txt'):
            with open(input_value, 'r') as file:
                numbers = file.readlines()
                return [int(number.strip()) for number in numbers if number.strip()]
        else:
            return [int(input_value)]
    except FileNotFoundError:
        print(f"Error: The file '{input_value}' does not exist.")
        sys.exit(1)
    except ValueError:
        print(f"Error: The input '{input_value}' contains invalid numbers.")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: ./muraseg.py <file_path_or_number> <projectid>")
        print("example: ./muraseg.py number.txt 523")
        print("example: ./muraseg.py 000012345 523")
        sys.exit(0)

    input_value = sys.argv[1]
    project_id = sys.argv[2]

    MULTIPLIER = 1001001001

    numbers = read_numbers_from_file_or_input(input_value)
    for syscd in numbers:
        try:
            Dslnumber = int(math.sqrt(syscd * int(project_id) * MULTIPLIER)) % 100
            print(syscd, Dslnumber)
        except ValueError:
            print(f"Error: Invalid calculation for syscd '{syscd}' and project_id '{project_id}'.")
            sys.exit(1)