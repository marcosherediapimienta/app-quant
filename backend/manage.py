import os
import sys
from pathlib import Path

from django.core.management import execute_from_command_line

QUANT_PATH = Path(__file__).resolve().parent.parent.parent / 'quant' / 'projects'
if QUANT_PATH.exists():
    sys.path.insert(0, str(QUANT_PATH))

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
