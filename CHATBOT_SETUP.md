# MedSync Chatbot Integration

## New Route: `/app/chatbot`

### Overview
A secure POST endpoint that validates user existence before forwarding messages to an n8n chatbot webhook.

### Endpoint Details
- **URL**: `POST /app/chatbot`
- **Base URL**: `https://medsync-android-backend.onrender.com/app/chatbot`

### Request Format
```json
{
  "user_id": 123,
  "message": "What are the symptoms of diabetes?"
}
```

### Response Format
```json
{
  "status": "success",
  "reply": "Response from chatbot...",
  "disclaimer": "This information is for educational purposes only..."
}
```

### Validation Flow
1. Checks if `user_id` and `message` are present
2. Verifies user exists in database
3. Returns HTTP 403 if user not found
4. Only forwards to n8n if user validation passes

### Environment Variables Required

Add these to your `.env` file:

```env
# n8n Chatbot Configuration
N8N_CHATBOT_WEBHOOK_URL=https://your-n8n-instance.com/webhook/chatbot
N8N_SECRET=your-secret-key-here
```

### Security Features
- User existence validation before forwarding
- Secret header (`x-internal-secret`) sent to n8n
- 30-second timeout for n8n responses
- Proper error handling for n8n service failures

### Error Responses
- `400`: Missing required fields
- `403`: User not found (unauthorized)
- `500`: Chatbot service not configured
- `502`: Chatbot service error
- `504`: Chatbot service timeout

### Files Created/Modified
1. **Created**: `backend/controllers/chatbotController.js`
2. **Created**: `backend/routes/chatbot.js`
3. **Modified**: `backend/server.js` (added route)
4. **Modified**: `api.txt` (added documentation)

### Testing
```bash
# Test with valid user
curl -X POST https://medsync-android-backend.onrender.com/app/chatbot \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "message": "Hello"}'

# Test with invalid user
curl -X POST https://medsync-android-backend.onrender.com/app/chatbot \
  -H "Content-Type: application/json" \
  -d '{"user_id": 99999, "message": "Hello"}'
```

### Next Steps
1. Set up n8n webhook and obtain webhook URL
2. Generate a secure secret key for `N8N_SECRET`
3. Add environment variables to production server
4. Configure n8n to handle the incoming requests
5. Restart backend server to load new route
