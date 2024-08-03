# Project Name

A brief description of your project.

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Technologies](#technologies)
- [Installation](#installation)
- [Usage](#usage)
- [Routes](#routes)
- [Environment Variables](#environment-variables)
- [License](#license)

## Introduction

Provide a short introduction to your project, what problem it solves, and its main functionalities.

# Features

- **User Authentication with Passport.js**: Secure user login and registration using Passport.js for authentication.
- **Session Management with express-session and connect-mongo**: Persistent session storage and management using MongoDB.
- **CRUD Operations for Todos and Finance**: Create, Read, Update, and Delete operations for managing tasks and financial records.
- **EJS Templating for Rendering Views**: Dynamic HTML rendering using Embedded JavaScript (EJS) templating engine.
- **Friend Requests**:
   - **Send Friend Requests**: Users can send friend requests by entering the email of another registered user.
   - **Accept or Reject Friend Requests**: Users can accept or reject incoming friend requests.
   - **Delete Friends**: Users can remove friends from their friends list.

## Technologies

- Node.js
- Express.js
- MongoDB
- Mongoose
- Passport.js
- EJS
- dotenv
- connect-mongo

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/yourusername/yourproject.git
    cd yourproject
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Set up your environment variables:

    Create a `.env` file in the root directory of your project and add the following variables:

    ```env
    MONGO_URI=your_mongo_connection_string
    PORT=3000
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_CALLBACK_URL=your_google_callback_url
    ```

## Usage

1. Start the server:

    ```bash
    npm start
    ```

2. Open your browser and navigate to `http://localhost:3000`.

## Routes

### Index Routes

- `GET /` - Render the home page

### Auth Routes

- `GET /auth/login` - Render the login page
- `POST /auth/login` - Handle login
- `GET /auth/logout` - Handle logout
- `GET /auth/register` - Render the registration page
- `POST /auth/register` - Handle registration

### API Routes

#### Todos

- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

#### Finance

- `GET /api/finance` - Get all finance records
- `POST /api/finance` - Create a new finance record
- `PUT /api/finance/:id` - Update a finance record
- `DELETE /api/finance/:id` - Delete a finance record

## Environment Variables

This project uses the following environment variables:

- `MONGO_URI` - The connection string for your MongoDB instance.
- `PORT` - The port on which the server will run.
- `GOOGLE_CLIENT_ID` - Your Google API client ID for OAuth.
- `GOOGLE_CLIENT_SECRET` - Your Google API client secret for OAuth.
- `GOOGLE_CALLBACK_URL` - The callback URL for Google OAuth.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Pivotal Tracker

For project management, we use Pivotal Tracker. You can view the project details [here](https://www.pivotaltracker.com/n/projects/2706137).
