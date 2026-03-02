# NPM Backend - Network Performance Monitor API

Flask REST API backend for Network Performance Monitoring system with MongoDB database.

## Features

- JWT Authentication (Signup, Signin, Signout)
- Full CRUD operations for:
  - Devices
  - Alerts
  - Network Health
  - QoS Events
  - Sessions
- Pagination support
- CORS enabled for Angular frontend
- Token blacklisting for logout

## Tech Stack

- **Framework**: Flask 3.0
- **Database**: MongoDB
- **Authentication**: JWT (PyJWT)
- **Password Hashing**: bcrypt
- **CORS**: flask-cors

## Installation

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start MongoDB**:
   ```bash
   mongod
   ```

3. **Run the server**:
   ```bash
   python app.py
   ```
   Server runs on `http://127.0.0.1:5001`

## API Endpoints

### Authentication
- `POST /auth/Signup` - Register new user
- `POST /auth/Signin` - Login (Basic Auth)
- `POST /auth/Signout` - Logout (requires JWT)

### Resources (all require JWT token in `x-access-token` header)
- `GET /devices?pn=1&ps=10` - Get devices with pagination
- `POST /devices` - Create device
- `PUT /devices/<id>` - Update device
- `DELETE /devices/<id>` - Delete device

Same pattern for: `/alerts`, `/network-health`, `/qos-events`, `/sessions`

## Project Structure

```
backend/
├── app.py                    # Main Flask application
├── globals.py                # Database connection & config
├── decorators.py             # JWT authentication decorator
├── requirements.txt          # Python dependencies
└── blueprint/
    ├── auth/                 # Authentication routes
    ├── Devices/              # Device management
    ├── alerts/               # Alert management
    ├── Network_health/       # Network health monitoring
    ├── qosevent/             # QoS events
    └── sessions/             # Session management
```

## Database Schema

**Database**: NPMDB

**Collections**:
- Registerd_users
- BlackList
- devices
- alerts
- network_health
- qos_events
- sessions

## Environment Variables

Edit `globals.py` to configure:
- `SECRET_KEY`: JWT signing key
- MongoDB connection string

## Author

Network Performance Monitoring System - Coursework Project
