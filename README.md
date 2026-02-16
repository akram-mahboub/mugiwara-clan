# 🏴‍☠️ The Mugiwara Clan — Backend API

A Node.js/Express proxy server that fetches and serves live data from the official [Clash of Clans API](https://developer.clashofclans.com/) for The Mugiwara clan website.

---

## 🌐 Live URL

```
https://mugiwara-clan.onrender.com
```

---

## ⚙️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | JavaScript runtime |
| Express.js | Web server framework |
| axios | HTTP requests to CoC API |
| node-cache | In-memory response caching |
| cors | Cross-origin request handling |
| dotenv | Environment variable management |
| Render | Cloud hosting & deployment |

---

## 📖 API Endpoints

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API info and available endpoints |
| `GET` | `/health` | Server status and cache stats |
| `GET` | `/myip` | Current server outbound IP address |
| `POST` | `/cache/clear` | Manually clear the response cache |

### Clan

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/clan/:clanTag` | Clan information and badge |
| `GET` | `/clan/:clanTag/members` | Full clan member list |
| `GET` | `/clan/:clanTag/currentwar` | Current war status |
| `GET` | `/clan/:clanTag/currentwar/leaguegroup` | Clan War League (CWL) data |
| `GET` | `/clan/:clanTag/capitalraidseasons` | Capital raid weekend history |

### Player

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/player/:playerTag` | Individual player stats |

> **Note:** Clan tags must be URL-encoded. Replace `#` with `%23`  
> Example: `/clan/%232L0QRVR2V` for clan tag `#2L0QRVR2V`

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0
- A Clash of Clans API key from [developer.clashofclans.com](https://developer.clashofclans.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mugiwara-backend.git
cd mugiwara-backend

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
COC_API_KEY=your_clash_of_clans_api_key_here
PORT=5000
```

> ⚠️ Never commit your `.env` file to GitHub. It is already excluded via `.gitignore`.

### Running Locally

```bash
# Production mode
npm start

# Development mode (auto-restarts on file changes)
npm run dev
```

Server starts at `http://localhost:5000`

---

## 🔑 API Key Setup

The Clash of Clans API requires **IP whitelisting** — only requests from registered IP addresses are accepted.

### Local Development

1. Go to [developer.clashofclans.com](https://developer.clashofclans.com/)
2. Log in with your Supercell account
3. Create a new API key
4. Add your local IP address to the allowed IPs
5. Copy the key into your `.env` file

### Production (Render)

1. Deploy the app to Render
2. Visit `https://mugiwara-clan.onrender.com/myip` to get the server's current IP
3. Add that IP to your API key in the CoC developer portal
4. Set `COC_API_KEY` in Render → Dashboard → Environment tab

> **Tip:** Render may use multiple outbound IPs. You can add up to 4 IPs per API key. Check `/myip` periodically and add any new IPs that appear.

---

## 💾 Caching

All API responses are cached in memory to reduce external API calls and improve response times.

| Endpoint | Cache Duration |
|----------|---------------|
| Clan info | 5 minutes |
| Members list | 5 minutes |
| Current war | 2 minutes |
| CWL data | 5 minutes |
| Raid seasons | 5 minutes |
| Player info | 5 minutes |

**Performance:**
- Cache hit response time: `< 100ms`
- Cache miss response time: `~1–2 seconds` (live API call)
- API call reduction: `~80–90%`

To manually clear the cache:
```bash
curl -X POST https://mugiwara-clan.onrender.com/cache/clear
```

---

## 📁 Project Structure

```
mugiwara-backend/
├── server.js         # Main Express server — all routes and logic
├── package.json      # Dependencies and scripts
├── .gitignore        # Excludes node_modules and .env
└── README.md         # This file
```

---

## 🔧 Scripts

```bash
npm start     # Start the server with node
npm run dev   # Start with nodemon (auto-reload on changes)
```

---

## 📦 Dependencies

```json
"dependencies": {
  "axios": "^1.6.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "node-cache": "^5.1.2"
},
"devDependencies": {
  "nodemon": "^3.0.2"
}
```

---

## 🌍 Deployment

This backend is deployed on [Render](https://render.com) and automatically redeploys on every push to the `main` branch.

| Setting | Value |
|---------|-------|
| Build Command | `npm install` |
| Start Command | `node server.js` |
| Node Version | >= 14.0.0 |
| Auto Deploy | Yes (from `main` branch) |

Environment variables are configured directly in the Render dashboard — no `.env` file is used in production.

---

## 🩺 Health Check

```bash
curl https://mugiwara-clan.onrender.com/health
```

```json
{
  "status": "ok",
  "timestamp": "2026-02-10T00:00:00.000Z",
  "uptime": 3600,
  "apiKeyConfigured": true,
  "cache": {
    "keys": 4,
    "stats": {
      "hits": 120,
      "misses": 8
    }
  }
}
```

---

## ⚠️ Error Responses

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "details": "Technical details from the API",
  "hint": "How to fix this"
}
```

| HTTP Status | Meaning |
|-------------|---------|
| `403` | Server IP not whitelisted in CoC API key |
| `404` | Clan or player tag not found |
| `429` | CoC API rate limit exceeded |
| `500` | Internal server error or CoC API unavailable |

---

## 🔗 Related

- **Frontend Repository:** [mugiwara-frontend](https://github.com/your-username/mugiwara-frontend)
- **Live Website:** [mugiwara-frontend.onrender.com](https://mugiwara-frontend.onrender.com)
- **CoC API Docs:** [developer.clashofclans.com/api-docs](https://developer.clashofclans.com/api-docs)

---

## 📄 License

MIT — akram-mahboub · 2026 🏴‍☠️
