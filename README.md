# Echoo

## Project Overview

Echoo is a modern web application designed to provide a robust and scalable platform for managing posts, users, and various other features. Built with TypeScript and Node.js, Echoo leverages a modular architecture to ensure maintainability and scalability. The project integrates AWS S3 for file storage, JWT for authentication, and MongoDB for data persistence.

## Features

### User Management

- **Sign Up**: Users can register with their details, including email, password, and other personal information.
- **Log In**: Secure authentication using JWT tokens.
- **Email Verification**: OTP-based email verification to ensure valid user accounts.
- **Password Reset**: Secure password reset functionality with OTP.
- **Google Login**: OAuth2 integration for Google login.
- **User Profile**: Retrieve and update user profile information.

### Post Management

- **Create Posts**: Users can create posts with content and optional file uploads.
- **Update Posts**: Edit existing posts.
- **Delete Posts**: Remove posts from the platform.
- **List Posts**: Retrieve a list of all posts with pagination.

### File Management

- **File Upload**: Upload files to AWS S3 using the `@aws-sdk/client-s3` library.
- **Large File Upload**: Support for uploading large files using AWS S3 multipart upload.
- **File Deletion**: Delete single or multiple files from AWS S3.
- **Presigned URLs**: Generate presigned URLs for secure file access.

### Comment Management

- **Add Comments**: Users can add comments to posts.
- **Reply to Comments**: Support for nested comments (replies).
- **Edit Comments**: Edit existing comments.
- **Delete Comments**: Remove comments.
- **List Comments**: Retrieve comments for a specific post.

### Chat Functionality

- **Real-time Messaging**: Instant messaging between users.
- **Group Chats**: Create and manage group conversations.
- **Message History**: Retrieve past chat messages.
- **Typing Indicators**: Show when users are typing.
- **Read Receipts**: Indicate when messages have been read.

### GraphQL API

- **File Upload**: Upload files to AWS S3 using the `@aws-sdk/client-s3` library.
- **Large File Upload**: Support for uploading large files using AWS S3 multipart upload.
- **File Deletion**: Delete single or multiple files from AWS S3.
- **Presigned URLs**: Generate presigned URLs for secure file access.

### Security

- **JWT Authentication**: Secure access to protected routes using JSON Web Tokens.
- **Password Hashing**: User passwords are hashed using bcrypt for security.
- **Token Revocation**: Support for revoking tokens to handle logout scenarios.

### Utilities

- **Error Handling**: Centralized error handling using custom `AppError` class.
- **Event Emitters**: Event-driven architecture for handling asynchronous tasks like sending emails.
- **Validation**: Schema-based validation for user inputs.

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose, Redis (for caching and real-time features)
- **Authentication**: JWT, bcrypt
- **File Storage**: AWS S3
- **Validation**: Joi
- **Real-time**: Socket.IO
- **GraphQL**: Apollo Server
- **Other Libraries**: `uuid`, `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `ioredis`

## Architecture
## Project Structure

The project follows a modular structure to ensure scalability and maintainability:

```
src/
├── DB/                # Database models and repositories
├── middleware/        # Middleware for authentication, validation, etc.
├── modules/           # Feature-specific modules (e.g., users, posts)
├── services/          # Business logic and service classes
├── graphql/           # GraphQL schema, resolvers, and types
├── websocket/         # Socket.IO event handlers and logic
├── utils/             # Utility functions and configurations
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- AWS Account with S3 configured

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/muhammedkh45/Echoo.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Echoo
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_BUCKET_NAME=your-s3-bucket-name
APPLICATION_NAME=Echoo
JWT_USER_SECRET=your-jwt-user-secret
JWT_ADMIN_SECRET=your-jwt-admin-secret
JWT_USER_SECRET_REFRESH=your-jwt-user-refresh-secret
JWT_ADMIN_SECRET_REFRESH=your-jwt-admin-refresh-secret
SALT_ROUNDS=10
WEB_CLIENT_ID=your-google-client-id
```

### Running the Application

Start the development server:

```bash
npm run start:dev
```

### Testing

Run the test suite:

```bash
npm test
```

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License.
