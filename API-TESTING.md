# Quick API checks

After starting the app, visit `http://localhost:5000/api/health`.

Expected response:

```json
{"status":"ok","message":"SkillSwap API is running."}
```

The signup/login and other routes are easiest to test through the website UI. Protected API routes require an `Authorization: Bearer YOUR_TOKEN` header.
