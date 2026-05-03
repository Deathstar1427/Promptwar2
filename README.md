# Election Assistant - Jan Shakti

AI-powered conversational guide for Indian elections. Helps citizens with voter registration, election timelines, and voting day procedures.

## Google Services Used

- [x] **Google Gemini 2.5 Flash** - AI model for generating election assistance responses
- [x] **Google Cloud Run** - Backend deployment (FastAPI)
- [x] **Firebase Hosting** - Frontend deployment (React)
- [x] **Google Cloud Secret Manager** - Secure API key storage
- [x] **Google Cloud Logging** - Structured JSON logging for all /chat requests
- [x] **Google Cloud Build** - CI/CD for containerized deployments

## Tech Stack

### Backend
- **FastAPI** - Python web framework
- **Google Gemini 2.5 Flash** - AI language model
- **Uvicorn** - ASGI server

### Frontend
- **React 18** with Vite
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
# Create .env with: GEMINI_API_KEY=your_key
python main.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /` - Health check
- `GET /test` - Test Gemini connectivity
- `POST /chat` - Send message to AI assistant

## Deployment

- Backend: Google Cloud Run
- Frontend: Firebase Hosting

## Security

See [SECURITY.md](SECURITY.md) for security model documentation.

## License

MIT