# JWT Auth Backend

A Spring Boot REST API that provides username/password registration and login backed by stateless JWT authentication, with role-based access control (`USER` / `ADMIN`). Includes a minimal React frontend for exercising the API.

## Features

- User registration with validated input (username, email, password)
- Login that returns a signed JWT
- Stateless authentication via a custom `JwtAuthenticationFilter` (no server-side sessions)
- Role-based authorization with `USER` and `ADMIN` roles
- Passwords hashed with BCrypt
- Centralized exception handling for validation errors, duplicate accounts, and bad credentials
- Environment-based configuration (`dev` / `prod` Spring profiles)
- React + Vite frontend demonstrating register, login, and protected-route flows

## Tech Stack

**Backend**
- Java 17
- Spring Boot 3.5 (Web, Security, Data JPA, Validation)
- PostgreSQL
- [jjwt](https://github.com/jwtk/jjwt) 0.12.6 for JWT creation/parsing
- Maven

**Frontend**
- React 19
- Vite 7

## Project Structure

```
jwt-auth-backend/
├── demo/                              # Spring Boot backend
│   └── src/main/java/com/example/demo/
│       ├── config/
│       │   └── SecurityConfig.java        # Security filter chain, password encoder
│       ├── controller/
│       │   ├── AuthController.java        # /api/auth/register, /api/auth/login
│       │   ├── UserController.java        # /api/user/profile (USER, ADMIN)
│       │   └── AdminController.java       # /api/admin/dashboard (ADMIN only)
│       ├── dto/                           # Request/response payloads
│       ├── entity/                        # User, Role
│       ├── exception/                     # Custom exceptions + global handler
│       ├── repository/                    # UserRepository
│       ├── security/
│       │   ├── JwtService.java            # Token generation & validation
│       │   ├── JwtAuthenticationFilter.java
│       │   ├── CustomUserDetails.java
│       │   └── CustomUserDetailsService.java
│       └── service/
│           └── AuthService.java           # Registration & login business logic
└── jwt-auth-frontend/                 # React + Vite frontend
    └── src/
        ├── App.jsx
        └── main.jsx
```

## Prerequisites

- Java 17+
- Maven (or use the included `mvnw` wrapper)
- PostgreSQL 13+
- Node.js 18+ and npm (for the frontend)

## Getting Started

### 1. Clone and configure the database

Create a PostgreSQL database for the app:

```sql
CREATE DATABASE jwt_auth;
```

### 2. Set required environment variables

The backend reads sensitive configuration from environment variables — nothing sensitive is hardcoded for production use.

| Variable | Required in | Description |
|---|---|---|
| `JWT_SECRET` | dev & prod | HMAC signing key, **must be at least 32 bytes** |
| `JWT_EXPIRATION` | optional | Token lifetime in ms (default `3600000` = 1 hour) |
| `DATABASE_URL` | dev & prod | JDBC URL, e.g. `jdbc:postgresql://localhost:5432/jwt_auth` |
| `DATABASE_USERNAME` | prod | Database username |
| `DATABASE_PASSWORD` | prod | Database password |
| `PORT` | prod (optional) | Server port (default `8080`) |

Example for local development (macOS/Linux):

```bash
export JWT_SECRET="a-long-random-string-at-least-32-bytes"
export DATABASE_URL="jdbc:postgresql://localhost:5432/jwt_auth"
```

PowerShell:

```powershell
$env:JWT_SECRET="a-long-random-string-at-least-32-bytes"
$env:DATABASE_URL="jdbc:postgresql://localhost:5432/jwt_auth"
```

> **Note:** The `dev` profile currently has a placeholder database username/password in `application-dev.properties`. Update these to match your local PostgreSQL setup, or override them with `DATABASE_USERNAME` / `DATABASE_PASSWORD` env vars before running.

### 3. Run the backend

By default the app activates the `dev` profile.

```bash
cd demo
./mvnw spring-boot:run
```

The API will start on `http://localhost:8080`.

To run with the `prod` profile:

```bash
SPRING_PROFILES_ACTIVE=prod ./mvnw spring-boot:run
```

### 4. Run the frontend

```bash
cd jwt-auth-frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api/**` requests to `http://localhost:8080` (configured in `vite.config.js`).

## API Reference

All endpoints are prefixed with `/api`.

### `POST /api/auth/register`

Registers a new user with the default `USER` role.

**Request body**

```json
{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "SecurePass123"
}
```

| Field | Rules |
|---|---|
| `username` | required, 3–20 characters |
| `email` | required, valid email format |
| `password` | required, 8–100 characters |

**Response** — `201 Created`

```json
{
  "id": 1,
  "username": "jdoe",
  "email": "jdoe@example.com",
  "role": "USER"
}
```

### `POST /api/auth/login`

Authenticates a user and returns a signed JWT.

**Request body**

```json
{
  "username": "jdoe",
  "password": "SecurePass123"
}
```

**Response** — `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "jdoe",
  "role": "ROLE_USER"
}
```

### `GET /api/user/profile`

Returns the authenticated user's profile. Requires role `USER` or `ADMIN`.

**Headers**

```
Authorization: Bearer <token>
```

**Response** — `200 OK`

```json
{
  "message": "You accessed a protected endpoint",
  "username": "jdoe",
  "role": "ROLE_USER"
}
```

### `GET /api/admin/dashboard`

Returns a static admin welcome payload. Requires role `ADMIN`.

**Headers**

```
Authorization: Bearer <token>
```

**Response** — `200 OK`

```json
{
  "message": "Welcome to the admin dashboard"
}
```

### Error responses

| Status | Cause |
|---|---|
| `400 Bad Request` | Validation failure (missing/invalid fields) |
| `401 Unauthorized` | Invalid username or password |
| `403 Forbidden` | Valid token, but insufficient role for the endpoint |
| `409 Conflict` | Username or email already registered |

Example error body:

```json
{
  "error": "Username already exists"
}
```

## Security Notes

- Passwords are hashed with BCrypt before storage — plaintext passwords are never persisted.
- Sessions are stateless (`SessionCreationPolicy.STATELESS`); every protected request must carry a valid `Authorization: Bearer <token>` header.
- CSRF protection is disabled, which is appropriate for a stateless, token-based API but assumes the frontend never relies on cookie-based auth.
- `jwt.secret` is required at startup and validated to be at least 32 bytes to satisfy HMAC-SHA signing requirements.
- Before deploying to production, rotate the default/example secrets, set `spring.jpa.hibernate.ddl-auto=validate` (already set in the `prod` profile), and put the app behind HTTPS so bearer tokens aren't sent in the clear.

## Roadmap / Possible Improvements

- Refresh token support (current tokens expire after 1 hour with no renewal flow)
- Token revocation / logout blacklist
- Rate limiting on `/api/auth/login` to mitigate brute-force attempts
- Integration tests for controllers and security filter
- Dockerfile / docker-compose for one-command local setup

## License

No license specified. Add a `LICENSE` file if you intend to open-source this project.
