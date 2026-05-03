# Election Assistant 🗳️

An AI-powered election guide for Indian elections. Built for PromptWars Challenge 2.

## Features
- **Guided Flows**: Quick starters for registration, timelines, and voting day.
- **Conversational Chat**: Ask anything about Indian elections in plain language.
- **Hinglish Support**: Gemini auto-detects and matches your language.
- **Step-by-Step**: Complex processes are explained one step at a time.
- **Premium UI**: Modern dark-themed glassmorphic design with smooth animations.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: FastAPI + Gemini 1.5 Flash
- **Deployment**: Firebase Hosting (Frontend) & Google Cloud Run (Backend)

## Google Services Used
- ✅ **Google Gemini 1.5 Flash API** - AI engine for election guidance chatbot
- ✅ **Google Cloud Run** - Serverless backend deployment
- ✅ **Firebase Hosting** - Frontend deployment and CDN
- ✅ **Google Cloud Secret Manager** - Secure API key management
- ✅ **Google Cloud Logging** - Structured logging and monitoring
- ✅ **Firebase Analytics** - User engagement tracking (optional)

## Security Features
- ✅ **CORS Protection**: Restricted to Firebase domain only
- ✅ **API Key Security**: Uses Cloud Run Secrets (not in code)
- ✅ **Rate Limiting**: 10 requests per 60 seconds per IP
- ✅ **Input Validation**: Message size limits, history bounds
- ✅ **Structured Logging**: JSON logs for Cloud Logging integration

## Local Setup

### Backend
1. Go to `backend/` directory.
2. Create a `.env` file (see `.env.example`):
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Get your Gemini API key: https://aistudio.google.com/app/apikey
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `python main.py`
   - Backend will be available at `http://localhost:8080`

### Frontend
1. Go to `frontend/` directory.
2. Install dependencies: `npm install`
3. Run the dev server: `npm run dev`
   - Frontend will be available at `http://localhost:5173`
   - Automatically proxies API calls to `http://localhost:8080`

## Production Deployment

### Prerequisites
- Google Cloud Project with billing enabled
- `gcloud` CLI installed and configured
- Firebase project created
- Gemini API key from https://aistudio.google.com/app/apikey

### Step 1: Setup Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="election-assistant-prod"
export REGION="asia-south1"  # Mumbai

# Create or select project
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
```

### Step 2: Create Cloud Run Secret for API Key

```bash
# Create secret with your Gemini API key
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create gemini-key --data-file=-

# Grant Cloud Run service account access
gcloud secrets add-iam-policy-binding gemini-key \
  --member="serviceAccount:$PROJECT_ID@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Deploy Backend to Cloud Run

**Option A: Using Automated Build (cloudbuild.yaml)**

```bash
cd election-assistant

# Deploy using Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_GEMINI_API_KEY=$(echo -n "YOUR_GEMINI_API_KEY" | base64)

# Get the Cloud Run service URL
gcloud run services describe election-assistant --format='value(status.url)' --region=$REGION
```

**Option B: Manual Docker Build**

```bash
# Build and push Docker image
docker build -t gcr.io/$PROJECT_ID/election-assistant ./backend
docker push gcr.io/$PROJECT_ID/election-assistant

# Deploy to Cloud Run
GEMINI_KEY=$(gcloud secrets versions access latest --secret=gemini-key)

gcloud run deploy election-assistant \
  --image gcr.io/$PROJECT_ID/election-assistant \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="$GEMINI_KEY" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --max-instances 100
```

### Step 4: Get Cloud Run Service URL

```bash
BACKEND_URL=$(gcloud run services describe election-assistant \
  --format='value(status.url)' \
  --region=$REGION)

echo "Backend URL: $BACKEND_URL"
```

### Step 5: Deploy Frontend to Firebase

```bash
cd election-assistant/frontend

# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Set your Firebase project
firebase use election-assistant-prod

# Build with backend URL
VITE_API_URL="$BACKEND_URL" npm run build

# Deploy to Firebase Hosting
firebase deploy
```

### Step 6: Verify Deployment

```bash
# Check Cloud Run logs
gcloud run logs read election-assistant --region=$REGION --limit=50

# Test backend endpoint
curl https://election-assistant-xyz.run.app/

# Open frontend in browser
firebase open hosting:site
```

## Environment Variables

### Backend (Cloud Run)
- `GEMINI_API_KEY` - Your Google Gemini API key (via Cloud Secrets)
- `PORT` - Server port (default: 8080, set by Cloud Run)

### Frontend (Firebase)
- `VITE_API_URL` - Backend API URL (set during build)

## API Endpoints

### Health Check
```
GET /
Response: {"status": "ok", "message": "Election Assistant API is running"}
```

### Chat Endpoint
```
POST /chat
Content-Type: application/json

Request:
{
  "message": "How do I register to vote?",
  "history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi! How can I help?"}
  ],
  "context": "general|first_time_voter|existing_voter"
}

Response:
{
  "reply": "To register, visit voters.eci.gov.in..."
}

Error Responses:
- 400: Bad Request (message too long, invalid input)
- 429: Too Many Requests (rate limit exceeded: 10 req/60s per IP)
- 503: Service Unavailable (API error)
```

## Rate Limiting

- **Limit**: 10 requests per 60 seconds per IP address
- **Status Code**: 429 (Too Many Requests)
- **Error Message**: "Too many requests. Maximum 10 requests per minute allowed."

## Input Validation

- **Message**: Max 500 characters
- **History**: Max 10 messages in conversation
- **Message Content**: Cannot be empty

## Troubleshooting

### Backend Issues

**Container fails to start**
```bash
# Check logs
gcloud run logs read election-assistant --region=$REGION --limit=100

# Verify environment variable
gcloud run services describe election-assistant --region=$REGION
```

**API key not working**
```bash
# Verify secret exists and is accessible
gcloud secrets versions access latest --secret=gemini-key

# Check service account permissions
gcloud secrets get-iam-policy gemini-key
```

**CORS errors in frontend**
- Ensure `election-assistant-prod.web.app` is in CORS whitelist in `backend/main.py`
- For custom domains, add them to the `allowed_origins` list
- Local development uses `http://localhost:5173` (already whitelisted)

### Frontend Issues

**API_URL not injected correctly**
```bash
# Ensure VITE_API_URL is set during build
VITE_API_URL="https://election-assistant-xyz.run.app" npm run build

# Check built files
grep -r "vite-api-url" dist/ || grep -r "election-assistant" dist/
```

**Firebase deploy fails**
```bash
# Ensure you're logged in
firebase login

# Set correct project
firebase use election-assistant-prod

# Check configuration
firebase projects:list
```

## Architecture

```
┌─────────────────────────────────────────┐
│   Firebase Hosting (Frontend)           │
│   https://election-assistant-prod       │
│   .web.app                              │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ↓
┌─────────────────────────────────────────┐
│   Cloud Run (Backend)                   │
│   FastAPI + Uvicorn                     │
│   https://election-assistant-xyz       │
│   .run.app                              │
│                                         │
│   ├─ Rate Limiting (10 req/60s)         │
│   ├─ Input Validation (500 chars)       │
│   └─ CORS (Firebase domain only)        │
└──────────────┬──────────────────────────┘
               │ REST API
               ↓
┌─────────────────────────────────────────┐
│   Google Gemini 1.5 Flash API           │
│   (Secured via Cloud Secrets)           │
└─────────────────────────────────────────┘
```

## Monitoring

### Cloud Logging
Access logs at: https://console.cloud.google.com/logs/query

Query for application logs:
```
resource.type="cloud_run_revision"
resource.labels.service_name="election-assistant"
```

### Metrics
- CPU usage
- Memory usage
- Request count and latency
- Error rates

View in Cloud Console: Monitoring → Dashboards

## Cost Optimization

- **Always Free Tier**: 2 million requests/month to Cloud Run
- **Firebase Hosting**: 10 GB storage, 360 MB/day bandwidth (free)
- **Gemini API**: Check pricing at https://ai.google.dev/pricing

## Support & Issues

- Report issues: https://github.com/anomalyco/opencode
- Gemini API docs: https://ai.google.dev/docs
- Cloud Run docs: https://cloud.google.com/run/docs
- Firebase docs: https://firebase.google.com/docs
