<div id="top">

<!-- HEADER STYLE: CLASSIC -->
<div align="center">


# NOTES

<em>Empower Ideas, Capture Moments, Transform Your Workflow</em>

<!-- BADGES -->
<img src="https://img.shields.io/github/last-commit/MaksymMartseniuk/notes?style=flat&logo=git&logoColor=white&color=0080ff" alt="last-commit">
<img src="https://img.shields.io/github/languages/top/MaksymMartseniuk/notes?style=flat&color=0080ff" alt="repo-top-language">
<img src="https://img.shields.io/github/languages/count/MaksymMartseniuk/notes?style=flat&color=0080ff" alt="repo-language-count">

<em>Built with the tools and technologies:</em>

<img src="https://img.shields.io/badge/JSON-000000.svg?style=flat&logo=JSON&logoColor=white" alt="JSON">
<img src="https://img.shields.io/badge/Markdown-000000.svg?style=flat&logo=Markdown&logoColor=white" alt="Markdown">
<img src="https://img.shields.io/badge/npm-CB3837.svg?style=flat&logo=npm&logoColor=white" alt="npm">
<img src="https://img.shields.io/badge/Redis-FF4438.svg?style=flat&logo=Redis&logoColor=white" alt="Redis">
<img src="https://img.shields.io/badge/JavaScript-F7DF1E.svg?style=flat&logo=JavaScript&logoColor=black" alt="JavaScript">
<img src="https://img.shields.io/badge/Celery-37814A.svg?style=flat&logo=Celery&logoColor=white" alt="Celery">
<img src="https://img.shields.io/badge/Django-092E20.svg?style=flat&logo=Django&logoColor=white" alt="Django">
<br>
<img src="https://img.shields.io/badge/React-61DAFB.svg?style=flat&logo=React&logoColor=black" alt="React">
<img src="https://img.shields.io/badge/Docker-2496ED.svg?style=flat&logo=Docker&logoColor=white" alt="Docker">
<img src="https://img.shields.io/badge/Python-3776AB.svg?style=flat&logo=Python&logoColor=white" alt="Python">
<img src="https://img.shields.io/badge/Vite-646CFF.svg?style=flat&logo=Vite&logoColor=white" alt="Vite">
<img src="https://img.shields.io/badge/ESLint-4B32C3.svg?style=flat&logo=ESLint&logoColor=white" alt="ESLint">
<img src="https://img.shields.io/badge/Axios-5A29E4.svg?style=flat&logo=Axios&logoColor=white" alt="Axios">

</div>
<br>

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Testing](#testing)

---

## Overview

Notes is a full-stack note-taking application built with a Django backend and a React frontend, designed to deliver a secure, scalable, and user-friendly experience. It supports rich text editing, version history, tagging, and real-time synchronization, making note management effortless and efficient.

**Why notes?**

This project empowers developers to build and extend a modern note platform with features like:

- 🧩 **🔧 Customizable Architecture:** Modular design with caching, background tasks, and API endpoints for scalable development.
- 🚀 **⚡ Fast Development:** Integrated tools like Vite, ESLint, and hot module replacement streamline frontend workflows.
- 🔐 **🔑 Secure Authentication:** Google OAuth, email verification, and JWT tokens ensure user data safety.
- 📝 **📚 Rich Note Management:** Version control, tags, autosave, and offline support enhance user productivity.
- 🌐 **🌟 Seamless User Experience:** Real-time sync, protected routes, and intuitive UI components create a smooth workflow.

---

## Getting Started

### Prerequisites

This project requires the following dependencies:

- **Programming Language:** JavaScript
- **Package Manager:** Pipenv, Npm
- **Container Runtime:** Docker

### Installation

Build notes from the source and install dependencies:

1. **Clone the repository:**

    ```sh
    ❯ git clone https://github.com/MaksymMartseniuk/notes
    ```

2. **Navigate to the project directory:**

    ```sh
    ❯ cd notes
    ```

3. **Install the dependencies:**

**Using [docker](https://www.docker.com/):**

```sh
❯ docker build -t MaksymMartseniuk/notes .
```
**Using [pipenv](https://pipenv.pypa.io/):**

```sh
❯ pipenv install
```
**Using [npm](https://www.npmjs.com/):**

```sh
❯ npm install
```

### Usage

Run the project with:

**Using [docker](https://www.docker.com/):**

```sh
docker run -it {image_name}
```
**Using [pipenv](https://pipenv.pypa.io/):**

```sh
pipenv shell
 pipenv run python {entrypoint}
```
**Using [npm](https://www.npmjs.com/):**

```sh
npm start
```

### Testing

Notes uses the {__test_framework__} test framework. Run the test suite with:

**Using [docker](https://www.docker.com/):**

```sh
echo 'INSERT-TEST-COMMAND-HERE'
```
**Using [pipenv](https://pipenv.pypa.io/):**

```sh
pipenv shell
 pipenv run pytest
```
**Using [npm](https://www.npmjs.com/):**

```sh
npm test
```

---

<div align="left"><a href="#top">⬆ Return</a></div>

---
