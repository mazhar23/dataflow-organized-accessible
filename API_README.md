# Intulist REST API

This document describes the REST API endpoints for Intulist, implemented using Supabase Edge Functions.

## Base URL

```
https://<project-ref>.supabase.co/functions/v1
```

## Authentication

All API requests require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Obtain a JWT token by signing in via Supabase Auth.

## Endpoints

### Leads

#### GET /leads
List all leads with optional filtering.

**Query Parameters:**
- `order_id` (optional) - Filter by order ID
- `status` (optional) - Filter by status (Hot, Warm, Cold)
- `limit` (optional) - Number of results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "lead-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "city": "New York",
      "status": "Hot",
      "order_id": "order-uuid",
      "uploaded_at": "2024-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

#### POST /leads
Create one or more leads.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "city": "New York",
  "status": "Hot",
  "order_id": "order-uuid"
}
```

Or batch create:
```json
[
  { "name": "Lead 1", "order_id": "order-uuid" },
  { "name": "Lead 2", "order_id": "order-uuid" }
]
```

**Response:**
```json
{
  "data": [{ ...lead object... }],
  "message": "2 lead(s) created successfully"
}
```

#### GET /leads-by-id/:id
Get a specific lead by ID.

**Response:**
```json
{
  "data": { ...lead object... }
}
```

#### PUT /leads-by-id/:id
Update a lead.

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "Warm"
}
```

**Response:**
```json
{
  "data": { ...updated lead... },
  "message": "Lead updated successfully"
}
```

#### DELETE /leads-by-id/:id
Delete a lead.

**Response:**
```json
{
  "message": "Lead deleted successfully"
}
```

### Lists (Orders)

#### GET /lists
List all orders (referred to as "lists" in the API).

**Query Parameters:**
- `status` (optional) - Filter by status (Pending, In Progress, Completed)
- `limit` (optional) - Number of results per page (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "order-uuid",
      "title": "50 Leads/Day - March",
      "status": "In Progress",
      "client": {
        "name": "Acme Inc",
        "email": "client@example.com"
      },
      "leads_per_day": 50,
      "total_leads_ordered": 1000,
      "start_date": "2024-01-01",
      "end_date": "2024-01-31",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 10,
    "limit": 50,
    "offset": 0
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Internal Server Error

## Deploying Functions

To deploy these Edge Functions to Supabase:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy leads
supabase functions deploy leads-by-id
supabase functions deploy lists

# Set secrets (if needed)
supabase secrets set MY_SECRET=value
```

## Local Development

To run functions locally:

```bash
# Start Supabase locally
supabase start

# Serve functions
supabase functions serve

# Test with curl
curl -X GET \
  'http://localhost:54321/functions/v1/leads?limit=10' \
  -H 'Authorization: Bearer <your-token>'
```

## Rate Limits

Supabase Edge Functions have default rate limits based on your plan. See [Supabase pricing](https://supabase.com/pricing) for details.
