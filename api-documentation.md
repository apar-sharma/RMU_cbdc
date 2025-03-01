# CBDC API Documentation

## Base URL

`/api/v1`

## Authentication

All protected routes require authentication middleware
Authentication header required for protected routes

## Routes

### Authentication `/user`

| Method | Endpoint    | Auth Required | Parameters                | Description    |
| ------ | ----------- | ------------- | ------------------------- | -------------- |
| POST   | `/register` | No            | `{name, email, password}` | Create account |
| POST   | `/login`    | No            | `{email, password}`       | Login          |
| GET    | `/logout`   | Yes           | -                         | Logout         |

### User Management `/user`

| Method | Endpoint              | Auth Required | Parameters                   | Description         |
| ------ | --------------------- | ------------- | ---------------------------- | ------------------- |
| GET    | `/`                   | Yes           | -                            | Get all users       |
| GET    | `/setPin`             | Yes           | `{userId, transactionPin}`   | Set transaction pin |
| GET    | `/showMe/:id`         | Yes           | id (URL param)               | Get current user    |
| PATCH  | `/updateUser`         | Yes           | `{email, name}`              | Update profile      |
| PATCH  | `/updateUserPassword` | Yes           | `{oldPassword, newPassword}` | Update password     |
| GET    | `/getBalance/:id`     | Yes           | id (URL param)               | Get user balance    |
| GET    | `/:id`                | Yes           | id (URL param)               | Get single user     |

### Transactions `/transactions`

| Method | Endpoint                    | Auth Required | Parameters                                                     | Description             |
| ------ | --------------------------- | ------------- | -------------------------------------------------------------- | ----------------------- |
| POST   | `/`                         | Yes           | `{senderId, receiverId, amount, transactionType, description}` | Create transaction      |
| GET    | `/:id`                      | Yes           | id (URL param)                                                 | List all transactions   |
| GET    | `/getSingleTransaction/:id` | Yes           | transactionId (URL param)                                      | Get transaction details |

### Minting Operations `/mint`

| Method | Endpoint | Auth Required | Role Required | Parameters         | Description                    |
| ------ | -------- | ------------- | ------------- | ------------------ | ------------------------------ |
| POST   | `/mint`  | Yes           | admin, bank   | `{userId, amount}` | Mint tokens for specified user |

### Images `/images`

| Method | Endpoint                     | Auth Required | Parameters     | Description                | Body Format |
| ------ | ---------------------------- | ------------- | -------------- | -------------------------- | ----------- |
| POST   | `/profile/:id`               | Yes           | id (URL param) | Upload profile photo       | form-data   |
| POST   | `/government-id/:id`         | Yes           | id (URL param) | Upload government ID       | form-data   |
| GET    | `/profile/:id`               | No            | id (URL param) | Get user's profile photo   | -           |
| GET    | `/government-id/:id`         | No            | id (URL param) | Get user's government ID   | -           |
| POST   | `/complete-registration/:id` | No            | id (URL param) | Complete user registration | form-data   |

### KYC Management `/kyc`

| Method | Endpoint       | Auth Required | Role Required | Parameters     | Description                           |
| ------ | -------------- | ------------- | ------------- | -------------- | ------------------------------------- |
| GET    | `/pending`     | Yes           | admin, bank   | -              | Get all users with pending KYC status |
| POST   | `/approve/:id` | Yes           | admin, bank   | id (URL param) | Approve KYC status for specified user |
| POST   | `/reject/:id`  | Yes           | admin, bank   | id (URL param) | Reject KYC status for specified user  |

#### Complete Registration Details

The `/complete-registration/:id` endpoint accepts:

- **URL Parameter**: user ID
- **Form Data**:
  - `dateOfBirth`: User's date of birth
  - `governmentIdNumber`: Government ID number/string
  - `profilePhoto`: Profile photo image file (max 5MB)
  - `governmentIdImage`: Government ID image file (max 5MB)
- **Response**: Updates user profile with all provided information and sets KYC status to "pending"

## Status Codes

- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

## Transaction Types

- transfer
- deposit
- withdrawal

## Models

```javascript
User {
  name: String,
  email: String,
  password: String,
  balance: Number,
  role: String,
  profilePhoto: {
    data: Buffer,
    contentType: String
  },
  governmentId: {
    data: Buffer,
    contentType: String
  },
  kycStatus: String,  // "not_submitted", "pending", "approved", "rejected"
  transactionPin: String
}

Transaction {
  sender: ObjectId,
  receiver: ObjectId,
  amount: Number,
  transactionType: String,
  description: String,
  status: String
}
```

## File Upload Requirements

### Profile Photo

- Max size: 5MB
- Type: Images only (JPEG, PNG, etc.)
- Updates user's profile photo field

### Government ID

- Max size: 5MB
- Type: Images only (JPEG, PNG, etc.)
- Updates user's government ID field
- Automatically sets KYC status to "pending" for admin review
