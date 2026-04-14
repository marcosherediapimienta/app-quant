import os

from django.core.management import execute_from_command_line


def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'general_settings.settings')
    execute_from_command_line(os.sys.argv)


if __name__ == '__main__':
    main()
