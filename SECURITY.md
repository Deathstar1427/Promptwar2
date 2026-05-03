# Security Model - Election Assistant

## Overview
This document describes the security measures implemented in the Election Assistant application.

## Security Measures

### Input Validation
- All user messages are validated for length (max 500 characters)
- Conversation history limited to 10 messages max
- Input sanitization removes HTML tags, JavaScript event handlers, and dangerous URL schemes

### Rate Limiting
- IP-based rate limiting: 10 requests per 60-second window per client IP
- Prevents abuse and ensures fair resource allocation

### API Security
- CORS restricted to whitelisted origins only
- No credentials in CORS headers
- All Gemini API calls use environment variable for API key (never hardcoded)

### Response Security
- HTTP security headers on all responses:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security: max-age=31536000

### Data Handling
- No persistent storage of user messages
- In-memory response caching with 1-hour TTL
- No PII stored in logs (IP addresses are logged for security monitoring)

## Reporting Security Issues
For security vulnerabilities, please contact the development team through GitHub issues.