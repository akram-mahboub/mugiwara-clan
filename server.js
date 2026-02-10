// ============================================
// CLASH OF CLANS API SERVER
// The Mugiwara Clan Website Backend
// ============================================

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize cache (5 minutes TTL)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// CORS configuration - Allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// ============================================
// CONFIGURATION
// ============================================

const API_KEY = process.env.COC_API_KEY;
const COC_API_BASE = 'https://api.clashofclans.com/v1';

// Validate API key exists
if (!API_KEY) {
  console.error('❌ ERROR: COC_API_KEY is not set in environment variables!');
  console.error('Set it in Render Dashboard → Environment tab');
  process.exit(1);
}

console.log('✅ API Key loaded successfully');

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Make API call to Clash of Clans API
 */
async function cocApiCall(endpoint) {
  const url = `${COC_API_BASE}${endpoint}`;
  
  try {
    console.log(`📡 Calling: ${endpoint}`);
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    
    console.log(`✅ Success: ${endpoint}`);
    return { success: true, data: response.data };
    
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.reason || 'Unknown error';
      
      console.error(`❌ API Error [${status}]: ${message}`);
      
      if (status === 403) {
        return {
          success: false,
          status: 403,
          error: 'IP not whitelisted. Add your server IP to this API key in CoC developer portal.',
          details: message,
          hint: 'Visit /myip endpoint to get your current IP'
        };
      } else if (status === 404) {
        return {
          success: false,
          status: 404,
          error: 'Resource not found',
          details: message
        };
      } else if (status === 429) {
        return {
          success: false,
          status: 429,
          error: 'Rate limit exceeded. Please try again later.',
          details: message
        };
      } else if (status >= 500) {
        return {
          success: false,
          status: status,
          error: 'Clash of Clans API is temporarily unavailable',
          details: message
        };
      }
      
      return {
        success: false,
        status: status,
        error: 'API request failed',
        details: message
      };
    }
    
    return {
      success: false,
      status: 0,
      error: 'Network error or timeout',
      details: error.message
    };
  }
}

/**
 * Make cached API call
 */
async function cachedCoCApiCall(endpoint, cacheKey) {
  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return { success: true, data: cached, fromCache: true };
  }
  
  console.log(`🔄 Cache miss: ${cacheKey}`);
  
  // Make API call
  const result = await cocApiCall(endpoint);
  
  // Cache successful responses
  if (result.success) {
    cache.set(cacheKey, result.data);
    console.log(`💾 Cached: ${cacheKey}`);
  }
  
  return result;
}

// ============================================
// ROOT ENDPOINT
// ============================================

app.get('/', (req, res) => {
  res.json({
    message: 'The Mugiwara Clan API Server',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      myip: '/myip',
      clan: '/clan/:clanTag',
      members: '/clan/:clanTag/members',
      currentWar: '/clan/:clanTag/currentwar',
      cwl: '/clan/:clanTag/currentwar/leaguegroup',
      raids: '/clan/:clanTag/capitalraidseasons',
      player: '/player/:playerTag'
    },
    documentation: 'Visit /health for server status'
  });
});

// ============================================
// UTILITY ENDPOINTS
// ============================================

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    apiKeyConfigured: !!API_KEY,
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats()
    }
  });
});

/**
 * Get server's public IP
 */
app.get('/myip', async (req, res) => {
  try {
    const services = [
      'https://api.ipify.org?format=json',
      'https://api.my-ip.io/ip.json',
      'https://ipapi.co/json/'
    ];
    
    for (const service of services) {
      try {
        const response = await axios.get(service, { timeout: 5000 });
        const ip = response.data.ip || response.data.IP || response.data;
        
        return res.json({
          ip: ip,
          message: 'Add this IP to your API key in CoC developer portal',
          url: 'https://developer.clashofclans.com/#/account',
          instructions: [
            '1. Go to the URL above',
            '2. Edit your API key',
            '3. Add this IP: ' + ip,
            '4. Save changes',
            '5. Wait 1-2 minutes',
            '6. Your API will work!'
          ]
        });
      } catch (err) {
        continue;
      }
    }
    
    res.status(500).json({ error: 'Could not detect IP' });
  } catch (error) {
    res.status(500).json({ error: 'IP detection failed' });
  }
});

/**
 * Clear cache endpoint
 */
app.post('/cache/clear', (req, res) => {
  const keys = cache.keys();
  cache.flushAll();
  res.json({
    message: 'Cache cleared',
    keysCleared: keys.length
  });
});

// ============================================
// CLAN ENDPOINTS
// ============================================

/**
 * Get clan information
 * GET /clan/:clanTag
 */
app.get('/clan/:clanTag', async (req, res) => {
  try {
    const clanTag = req.params.clanTag.replace('#', '%23');
    const cacheKey = `clan_${clanTag}`;
    
    const result = await cachedCoCApiCall(`/clans/${clanTag}`, cacheKey);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({
        error: result.error,
        details: result.details,
        hint: result.hint
      });
    }
  } catch (error) {
    console.error('Error in /clan/:clanTag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get clan members
 * GET /clan/:clanTag/members
 */
app.get('/clan/:clanTag/members', async (req, res) => {
  try {
    const clanTag = req.params.clanTag.replace('#', '%23');
    const cacheKey = `members_${clanTag}`;
    
    const result = await cachedCoCApiCall(`/clans/${clanTag}/members`, cacheKey);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({
        error: result.error,
        details: result.details,
        hint: result.hint
      });
    }
  } catch (error) {
    console.error('Error in /clan/:clanTag/members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get current clan war
 * GET /clan/:clanTag/currentwar
 */
app.get('/clan/:clanTag/currentwar', async (req, res) => {
  try {
    const clanTag = req.params.clanTag.replace('#', '%23');
    const cacheKey = `war_${clanTag}`;
    
    // Shorter cache for war data (2 minutes)
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    const result = await cocApiCall(`/clans/${clanTag}/currentwar`);
    
    if (result.success) {
      cache.set(cacheKey, result.data, 120); // 2 min cache
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({
        error: result.error,
        details: result.details,
        hint: result.hint
      });
    }
  } catch (error) {
    console.error('Error in /clan/:clanTag/currentwar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get clan war league group
 * GET /clan/:clanTag/currentwar/leaguegroup
 */
app.get('/clan/:clanTag/currentwar/leaguegroup', async (req, res) => {
  try {
    const clanTag = req.params.clanTag.replace('#', '%23');
    const cacheKey = `cwl_${clanTag}`;
    
    const result = await cachedCoCApiCall(
      `/clans/${clanTag}/currentwar/leaguegroup`,
      cacheKey
    );
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({
        error: result.error,
        details: result.details,
        hint: result.hint
      });
    }
  } catch (error) {
    console.error('Error in /clan/:clanTag/currentwar/leaguegroup:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get clan capital raid seasons
 * GET /clan/:clanTag/capitalraidseasons
 */
app.get('/clan/:clanTag/capitalraidseasons', async (req, res) => {
  try {
    const clanTag = req.params.clanTag.replace('#', '%23');
    const limit = req.query.limit || 10;
    const cacheKey = `raids_${clanTag}_${limit}`;
    
    const result = await cachedCoCApiCall(
      `/clans/${clanTag}/capitalraidseasons?limit=${limit}`,
      cacheKey
    );
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({
        error: result.error,
        details: result.details,
        hint: result.hint
      });
    }
  } catch (error) {
    console.error('Error in /clan/:clanTag/capitalraidseasons:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// PLAYER ENDPOINTS
// ============================================

/**
 * Get player information
 * GET /player/:playerTag
 */
app.get('/player/:playerTag', async (req, res) => {
  try {
    const playerTag = req.params.playerTag.replace('#', '%23');
    const cacheKey = `player_${playerTag}`;
    
    const result = await cachedCoCApiCall(`/players/${playerTag}`, cacheKey);
    
    if (result.success) {
      res.json(result.data);
    } else {
      res.status(result.status || 500).json({
        error: result.error,
        details: result.details,
        hint: result.hint
      });
    }
  } catch (error) {
    console.error('Error in /player/:playerTag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    availableEndpoints: {
      root: '/',
      health: '/health',
      myip: '/myip',
      clan: '/clan/:clanTag',
      members: '/clan/:clanTag/members',
      currentWar: '/clan/:clanTag/currentwar',
      cwl: '/clan/:clanTag/currentwar/leaguegroup',
      raids: '/clan/:clanTag/capitalraidseasons',
      player: '/player/:playerTag'
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log('   The Mugiwara Clan API Server');
  console.log('   ========================================');
  console.log(`   📍 Server: http://localhost:${PORT}`);
  console.log(`   🔑 API Key: ${API_KEY ? API_KEY.substring(0, 20) + '...' : 'NOT SET'}`);
  console.log('   ========================================');
  console.log('\n📖 Available Endpoints:');
  console.log('   GET  /                  - API info');
  console.log('   GET  /health            - Server health');
  console.log('   GET  /myip              - Get server IP');
  console.log('   POST /cache/clear       - Clear cache');
  console.log('   GET  /clan/:tag         - Clan info');
  console.log('   GET  /clan/:tag/members - Clan members');
  console.log('   GET  /clan/:tag/currentwar - Current war');
  console.log('   GET  /clan/:tag/currentwar/leaguegroup - CWL');
  console.log('   GET  /clan/:tag/capitalraidseasons - Raids');
  console.log('   GET  /player/:tag       - Player info');
  console.log('\n💡 Next Steps:');
  console.log('   1. Visit /myip to get your server IP');
  console.log('   2. Add IP to CoC API key at:');
  console.log('      https://developer.clashofclans.com/');
  console.log('   3. Test: /clan/2L0QRVR2V');
  console.log('\n✅ Server is ready!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing server');
  process.exit(0);
});
