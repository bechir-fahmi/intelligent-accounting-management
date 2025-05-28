<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# PFE Accounting Backend

This is the backend for the PFE Accounting application, a web application for automating accounting document management using AI.

## Authentication System

The authentication system uses JWT (JSON Web Tokens) and implements role-based access control. It provides:

- User registration and login
- Role-based authorization (User and Admin roles)
- Secure password hashing with bcrypt
- Session management with JWT tokens
- Protected API endpoints

## Database Configuration

The application uses PostgreSQL for data storage. Make sure you have PostgreSQL installed and running before starting the application. The default configuration is:

- Host: localhost
- Port: 5432
- Username: postgres
- Password: root
- Database: pfe_accounting

You can modify these settings in the `.env` file.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ "email": string, "firstName": string, "lastName": string, "password": string }`
  - Returns: User data and access token

- `POST /api/auth/login` - Login with credentials
  - Body: `{ "email": string, "password": string }`
  - Returns: User data and access token

### Users

- `GET /api/users/profile` - Get current user profile (requires authentication)
  - Returns: Current user data

- `GET /api/users` - Get all users (requires admin role)
  - Returns: List of all users

### Profile API Endpoints

- `GET /api/users/profile` - Get detailed profile for the current user
  - **Auth Required:** Yes (JWT)
  - **Response:**
  ```json
  {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "type": "admin|finance|accountant|finance_director",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
  ```

- `GET /api/users/profile/:id` - Get detailed profile for a specific user by ID
  - **Auth Required:** Yes (JWT + Admin)
  - **URL Params:** id=[uuid]
  - **Response:** Same as above

## Setup Instructions

1. Install dependencies:
   ```