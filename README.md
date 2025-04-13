# Google Admin MCP Server

A FastMCP server for managing Google Workspace users through the Admin Directory API.

## Features

- List users in a domain
- Create new users with secure random passwords
- Get detailed user information
- Suspend and unsuspend users

## Prerequisites

- Node.js >= 20.0.0
- Google Workspace Admin account
- Google Admin Directory API enabled
- Base64 encoded OAuth2 token in `GOOGLE_TOKEN_JSON` environment variable

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Configuration

Set the required environment variable:
```bash
export GOOGLE_TOKEN_JSON="your_base64_encoded_token"
```

## Available Tools

### listUsers
Lists users in a domain.
```json
{
  "domain": "yourdomain.com"
}
```

### addUser
Creates a new user with a secure random password.
```json
{
  "primaryEmail": "user@yourdomain.com",
  "firstName": "First",
  "lastName": "Last"
}
```

### getUser
Gets detailed information about a specific user.
```json
{
  "userKey": "user@yourdomain.com"
}
```

### suspendUser
Suspends a user account.
```json
{
  "userKey": "user@yourdomain.com"
}
```

### unsuspendUser
Unsuspends a user account.
```json
{
  "userKey": "user@yourdomain.com"
}
```

## Running the Server

Start the server:
```bash
npm start
```

## Security Notes

- All users created will be required to change their password on first login
- Passwords are generated securely with:
  - Minimum 12 characters
  - Uppercase and lowercase letters
  - Numbers
  - Special characters
- The server requires a valid OAuth2 token with appropriate Admin Directory API scopes

## Error Handling

The server provides clear error messages for:
- Authentication failures
- Invalid parameters
- API errors
- Missing environment variables

## License

MIT License