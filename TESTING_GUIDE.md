# Testing Guide & Examples

## Testing the System End-to-End

### Prerequisites
- Node.js running with MongoDB connected
- Postman or curl installed
- Server running on http://localhost:3000

---

## Test Scenario 1: Complete Flow

### Step 1: Add Phone Numbers (Franchise)
```bash
curl -X POST http://localhost:3000/api/franchise/franchise/add-phone \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseID": "FRAN001",
    "phoneNumber": "9876543210",
    "name": "John Doe"
  }'

curl -X POST http://localhost:3000/api/franchise/franchise/add-phone \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseID": "FRAN001",
    "phoneNumber": "9876543211",
    "name": "Jane Smith"
  }'
```

**Expected Response:**
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

### Step 2: Get Phone List (Franchise)
```bash
curl http://localhost:3000/api/franchise/franchise/FRAN001/phone-list
```

**Expected Response:**
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
      "name": "Jane Smith",
      "createdAt": "2024-01-15T10:35:00Z"
    }
  ],
  "count": 2
}
```

---

### Step 3: Send WhatsApp Links
```bash
curl -X POST http://localhost:3000/api/franchise/franchise/send-whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseID": "FRAN001",
    "phoneNumbers": ["9876543210", "9876543211"]
  }'
```

**Expected Response:**
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
    }
  ]
}
```

---

### Step 4: Check Phone Hasn't Submitted Yet
```bash
curl "http://localhost:3000/api/franchise/student/check-phone?phoneNumber=9876543210&franchiseID=FRAN001"
```

**Expected Response:**
```json
{
  "status": true,
  "alreadySubmitted": false,
  "message": "Phone number is valid"
}
```

---

### Step 5: Student Submits Form
```bash
curl -X POST http://localhost:3000/api/franchise/student/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "franchiseID": "FRAN001",
    "studentName": "John Doe",
    "city": "Mumbai",
    "state": "Maharashtra",
    "interested": true
  }'
```

**Expected Response:**
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
    "assignedToFranchiseID": null,
    "isValid": true
  }
}
```

---

### Step 6: Check Phone Now Shows Already Submitted
```bash
curl "http://localhost:3000/api/franchise/student/check-phone?phoneNumber=9876543210&franchiseID=FRAN001"
```

**Expected Response:**
```json
{
  "status": true,
  "alreadySubmitted": true,
  "message": "This phone number has already submitted"
}
```

---

### Step 7: Try to Submit Again with Same Phone (Should Fail)
```bash
curl -X POST http://localhost:3000/api/franchise/student/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "franchiseID": "FRAN001",
    "studentName": "John Doe",
    "city": "Mumbai",
    "state": "Maharashtra",
    "interested": true
  }'
```

**Expected Response (Error):**
```json
{
  "status": false,
  "message": "This phone number has already submitted a response"
}
```

---

### Step 8: Franchise Views Responses
```bash
curl http://localhost:3000/api/franchise/franchise/FRAN001/responses
```

**Expected Response:**
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
      }
    ],
    "interested": [
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
    "notInterested": [],
    "counts": {
      "total": 1,
      "interested": 1,
      "notInterested": 0
    }
  }
}
```

---

### Step 9: Admin Views All Responses
```bash
curl http://localhost:3000/api/franchise/admin/all-responses
```

**Expected Response:**
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

### Step 10: Admin Assigns Student to Different Franchise
```bash
curl -X POST http://localhost:3000/api/franchise/admin/assign-student \
  -H "Content-Type: application/json" \
  -d '{
    "responseID": "64a5f3c9e4b0a1b2c3d4e5f8",
    "assignToFranchiseID": "FRAN002"
  }'
```

**Expected Response:**
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

## Test Scenario 2: Duplicate Phone Number Prevention

### Add Same Phone to Different Franchise
```bash
curl -X POST http://localhost:3000/api/franchise/franchise/add-phone \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseID": "FRAN002",
    "phoneNumber": "9876543210",
    "name": "John Doe"
  }'
```

**Should succeed** - Same phone can be added to different franchises

---

### Submit Form with Same Phone for Different Franchise
```bash
curl -X POST http://localhost:3000/api/franchise/student/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "franchiseID": "FRAN002",
    "studentName": "John Doe",
    "city": "Delhi",
    "state": "Delhi",
    "interested": false
  }'
```

**Should succeed** - Same phone can submit to different franchises

---

### Try Submitting Same Phone to Same Franchise Again
```bash
curl -X POST http://localhost:3000/api/franchise/student/submit-form \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9876543210",
    "franchiseID": "FRAN001",
    "studentName": "John Doe Updated",
    "city": "Pune",
    "state": "Maharashtra",
    "interested": false
  }'
```

**Should fail** - Duplicate submission for same phone + franchise

---

## Test Scenario 3: Admin Add & Send

```bash
curl -X POST http://localhost:3000/api/franchise/admin/add-number-and-link \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseID": "FRAN003",
    "phoneNumber": "9876543212",
    "name": "Admin Added Contact"
  }'
```

**Expected Response:**
```json
{
  "status": true,
  "message": "Number added and link sent",
  "data": {
    "phoneEntry": {
      "_id": "64a5f3c9e4b0a1b2c3d4e5f9",
      "franchiseID": "FRAN003",
      "phoneNumber": "9876543212",
      "name": "Admin Added Contact",
      "createdAt": "2024-01-15T15:00:00Z"
    },
    "link": "http://localhost:3001/submit-form?franchise=FRAN003&phone=9876543212",
    "whatsappStatus": "pending"
  }
}
```

---

## Error Test Cases

### 1. Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/franchise/franchise/add-phone \
  -H "Content-Type: application/json" \
  -d '{"franchiseID": "FRAN001"}'
```

**Expected Response:**
```json
{
  "status": false,
  "message": "franchiseID and phoneNumber are required"
}
```

---

### 2. Non-existent Franchise
```bash
curl -X POST http://localhost:3000/api/franchise/franchise/add-phone \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseID": "NONEXISTENT",
    "phoneNumber": "9876543210"
  }'
```

**Expected Response:**
```json
{
  "status": false,
  "message": "Franchise not found"
}
```

---

### 3. Duplicate Phone for Same Franchise
```bash
curl -X POST http://localhost:3000/api/franchise/franchise/add-phone \
  -H "Content-Type: application/json" \
  -d '{
    "franchiseID": "FRAN001",
    "phoneNumber": "9876543210",
    "name": "Duplicate"
  }'
```

**Expected Response:**
```json
{
  "status": false,
  "message": "Phone number already exists for this franchise"
}
```

---

## MongoDB Query Examples

### Check FranchisePhoneList
```javascript
db.franchisephonelists.find({ franchiseID: "FRAN001" })
```

### Check StudentResponse
```javascript
db.studentresponses.find({ franchiseID: "FRAN001" })

// Find interested students
db.studentresponses.find({ franchiseID: "FRAN001", interested: true })

// Find assigned students
db.studentresponses.find({ assignedToFranchiseID: { $ne: null } })
```

### Get Statistics
```javascript
db.studentresponses.aggregate([
  {
    $group: {
      _id: "$franchiseID",
      total: { $sum: 1 },
      interested: {
        $sum: { $cond: ["$interested", 1, 0] }
      },
      notInterested: {
        $sum: { $cond: ["$interested", 0, 1] }
      },
      assigned: {
        $sum: { $cond: [{ $ne: ["$assignedToFranchiseID", null] }, 1, 0] }
      }
    }
  }
])
```

---

## Performance Testing

### Load Test: Send 100 WhatsApp Messages
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/franchise/franchise/send-whatsapp \
    -H "Content-Type: application/json" \
    -d "{
      \"franchiseID\": \"FRAN001\",
      \"phoneNumbers\": [\"987654321$i\"]
    }"
done
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Franchise not found" | Ensure franchise exists in Franchiselist collection |
| "Phone number already exists" | Use different phone or check DB for duplicates |
| "Already submitted" | Phone-franchiseID combo exists in StudentResponse |
| WhatsApp status "failed" | Check Twilio/MessageBird API keys and credentials |
| MongoDB connection error | Verify MONGOLOCAL env variable and MongoDB is running |
| CORS error | Ensure CORS is enabled in app.js |

---

## Notes

- All timestamps are in UTC (stored as ISO 8601)
- Phone numbers stored as strings (no formatting validation in demo)
- WhatsApp integration is a placeholder - update with real API
- All responses include `status` field for easy error handling
