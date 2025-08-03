Notes
Description
Notes is a web application for creating, editing, and managing notes with support for autosave, version history, server synchronization, and Google authentication. The project aims to provide a convenient and reliable tool for working with notes both online and offline.

Why use this project?
•User-friendly WYSIWYG editor based on Tiptap.
•Autosave feature with local buffering and deferred saving to the server via Redis and Celery.
•Support for note versions and change history.
•Google OAuth authentication.
•Ability to recover deleted notes.
•Simple interface for quick access and searching of notes.

Installation
Clone the repository:
git clone https://github.com/MaksymMartseniuk/notes.git
cd notes
Install frontend dependencies:
npm install
Install backend dependencies using Pipenv:
pipenv install
Activate the virtual environment:
pipenv shell
Configure Redis, Celery, and the database according to the documentation.

Run the backend server:
python manage.py runserver
Run the frontend:
npm start

Usage
Open your browser at http://localhost:5173/.

Log in using Google or create an account.

Create, edit, and save notes.

Use the search feature for quick access.

Take advantage of autosave and version history.

Technologies
Frontend: React, Tiptap Editor
Backend: Django REST Framework, Celery, Redis
Database: PostgreSQL (or another SQL database)
Authentication: Google OAuth2
Others: Docker, Webpack, ESLint
Contributing
If you'd like to help or suggest improvements, please open an issue or submit a pull request. Any support is appreciated.

Author
Maksym Marcenuk — GitHub Profile

License
This project is licensed under the MIT License.
