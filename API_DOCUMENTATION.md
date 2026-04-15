# Franchise & Student Response API Documentation

## Overview
This API enables franchises to manage phone numbers, send WhatsApp links, and admin to manage student responses.

## Base URL
```
http://localhost:3000/api/franchise
```

---

## FRANCHISE APIs

### 1. Add Phone Number to Franchise
**POST** `/franchise/add-phone`

**Request Body:**
```json
{
  "franchiseID": "FRAN001",
  "phoneNumber": "9876543210",
  "name": "John Doe (optional)"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Phone number added successfully",
  "data": {
    "_id": "64a5f3c9e4b0a1b2c3d4e5f6",
    "franchiseID": "FRAN001",
    "phoneNumber": "9876543210",
    "name": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Get All Phone Numbers for Franchise
**GET** `/franchise/:franchiseID/phone-list`

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "_id": "64a5f3c9e4b0a1b2c3d4e5f6",
      "franchiseID": "FRAN001",
      "phoneNumber": "9876543210",
      "name": "John Doe",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "64a5f3c9e4b0a1b2c3d4e5f7",
      "franchiseID": "FRAN001",
      "phoneNumber": "9876543211",
      "name": null,
      "createdAt": "2024-01-15T11:30:00Z"
    }
  ],
  "count": 2
}
```

---

### 3. Delete Phone Number
**DELETE** `/franchise/phone/:phoneID`

**Response:**
```json
{
  "status": true,
  "message": "Phone number deleted successfully"
}
```

---

### 4. Send WhatsApp Messages with Links
**POST** `/franchise/send-whatsapp`

**Request Body:**
```json
{
  "franchiseID": "FRAN001",
  "phoneNumbers": ["9876543210", "9876543211", "9876543212"]
}
```

**Response:**
```json
{
  "status": true,
  "message": "WhatsApp messages processed",
  "results": [
    {
      "phoneNumber": "9876543210",
      "status": "sent",
      "link": "http://localhost:3001/submit-form?franchise=FRAN001&phone=9876543210",
      "whatsappStatus": "pending"
    },
    {
      "phoneNumber": "9876543211",
      "status": "sent",
      "link": "http://localhost:3001/submit-form?franchise=FRAN001&phone=9876543211",
      "whatsappStatus": "pending"
    },
    {
      "phoneNumber": "9876543212",
      "status": "failed",
      "error": "Invalid phone number"
    }
  ]
}
```

---

### 5. Get All Student Responses for Franchise
**GET** `/franchise/:franchiseID/responses`

**Response:**
```json
{
  "status": true,
  "data": {
    "all": [
      {
        "_id": "64a5f3c9e4b0a1b2c3d4e5f8",
        "phoneNumber": "9876543210",
        "franchiseID": "FRAN001",
        "studentName": "John Doe",
        "city": "Mumbai",
        "state": "Maharashtra",
        "interested": true,
        "submittedAt": "2024-01-15T12:00:00Z",
        "assignedToFranchiseID": null
      },
      {
        "_id": "64a5f3c9e4b0a1b2c3d4e5f9",
        "phoneNumber": "9876543211",
        "franchiseID": "FRAN001",
        "studentName": "Jane Smith",
        "city": "Delhi",
        "state": "Delhi",
        "interested": false,
        "submittedAt": "2024-01-15T12:15:00Z",
        "assignedToFranchiseID": null
      }
    ],
    "interested": [...],
    "notInterested": [...],
    "counts": {
      "total": 2,
      "interested": 1,
      "notInterested": 1
    }
  }
}
```

---

## STUDENT APIs (PUBLIC)

### 6. Check if Phone Already Submitted
**GET** `/student/check-phone?phoneNumber=9876543210&franchiseID=FRAN001`

**Response:**
```json
{
  "status": true,
  "alreadySubmitted": false,
  "message": "Phone number is valid"
}
```

---

### 7. Submit Student Form
**POST** `/student/submit-form`

**Request Body:**
```json
{
  "phoneNumber": "9876543210",
  "franchiseID": "FRAN001",
  "studentName": "John Doe",
  "city": "Mumbai",
  "state": "Maharashtra",
  "interested": true
}
```

**Response:**
```json
{
  "status": true,
  "message": "Form submitted successfully",
  "data": {
    "_id": "64a5f3c9e4b0a1b2c3d4e5f8",
    "phoneNumber": "9876543210",
    "franchiseID": "FRAN001",
    "studentName": "John Doe",
    "city": "Mumbai",
    "state": "Maharashtra",
    "interested": true,
    "submittedAt": "2024-01-15T12:00:00Z",
    "assignedToFranchiseID": null
  }
}
```

---

## ADMIN APIs

### 8. Get All Student Responses
**GET** `/admin/all-responses`

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "_id": "64a5f3c9e4b0a1b2c3d4e5f8",
      "phoneNumber": "9876543210",
      "franchiseID": "FRAN001",
      "studentName": "John Doe",
      "city": "Mumbai",
      "state": "Maharashtra",
      "interested": true,
      "submittedAt": "2024-01-15T12:00:00Z",
      "assignedToFranchiseID": null
    }
  ],
  "stats": {
    "total": 1,
    "interested": 1,
    "notInterested": 0,
    "assigned": 0
  }
}
```

---

### 9. Assign Student to Franchise
**POST** `/admin/assign-student`

**Request Body:**
```json
{
  "responseID": "64a5f3c9e4b0a1b2c3d4e5f8",
  "assignToFranchiseID": "FRAN002"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Student assigned successfully",
  "data": {
    "_id": "64a5f3c9e4b0a1b2c3d4e5f8",
    "phoneNumber": "9876543210",
    "franchiseID": "FRAN001",
    "studentName": "John Doe",
    "city": "Mumbai",
    "state": "Maharashtra",
    "interested": true,
    "submittedAt": "2024-01-15T12:00:00Z",
    "assignedToFranchiseID": "FRAN002",
    "assignedAt": "2024-01-15T14:00:00Z"
  }
}
```

---

### 10. Add Number and Send Link (ADMIN)
**POST** `/admin/add-number-and-link`

**Request Body:**
```json
{
  "franchiseID": "FRAN001",
  "phoneNumber": "9876543210",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Number added and link sent",
  "data": {
    "phoneEntry": {...},
    "link": "http://localhost:3001/submit-form?franchise=FRAN001&phone=9876543210",
    "whatsappStatus": "pending"
  }
}
```

---

## Environment Variables Required

Add these to your `.env` file:

```env
FRONTEND_URL=http://localhost:3001
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE=whatsapp:+1234567890
```

---

## Key Features

✅ **Franchise Phone Management** - Add, view, delete phone numbers
✅ **Unique Links** - Each franchise-phone combination gets a unique link
✅ **Duplicate Prevention** - Same phone cannot submit twice for same franchise
✅ **WhatsApp Integration** - Send links via WhatsApp (via Twilio/MessageBird)
✅ **Admin Assignment** - Assign interested students to any franchise
✅ **Response Tracking** - Track interested/not interested students
✅ **Audit Trail** - All timestamps recorded

---

## Flow Diagram

```
FRANCHISE ADDS NUMBERS
        ↓
SENDS VIA WHATSAPP WITH UNIQUE LINK
        ↓
STUDENT RECEIVES LINK
        ↓
STUDENT SUBMITS FORM (with franchise-specific link)
        ↓
RESPONSE STORED (with duplicate check)
        ↓
FRANCHISE/ADMIN VIEWS RESPONSES
        ↓
ADMIN ASSIGNS TO DESIRED FRANCHISE
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Server Error

---

## Security Considerations

1. **Add Authentication** - Protect franchise and admin endpoints with JWT
2. **Phone Validation** - Validate phone format before storage
3. **Rate Limiting** - Limit WhatsApp sends to prevent abuse
4. **Input Sanitization** - Sanitize all user inputs
5. **Data Encryption** - Encrypt sensitive phone numbers if needed
