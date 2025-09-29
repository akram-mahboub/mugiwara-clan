require("dotenv").config();

const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");


const app = express();

// enable CORS so frontend can call backend
app.use(cors());

// Clash of Clans API key (keep it secret, don’t expose in frontend!)
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;


// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

/* // Optional: make "/" go to home.html automatically
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
}); */


// Load keys into an array
const cocKeys = [
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
];

// Simple round-robin rotation
let keyIndex = 0;
function getNextKey() {
  const key = cocKeys[keyIndex];
  keyIndex = (keyIndex + 1) % cocKeys.length;
  return key;
}





// Example route: get clan info by tag
app.get("/clan/:tag", async (req, res) => {
  try {
    const tag = encodeURIComponent("#" + req.params.tag);
    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${tag}`,
      {
        headers: {
          Authorization: `Bearer ${getNextKey()}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch clan data" });
  }
});

// Example route: get clan members
app.get("/clan/:tag/members", async (req, res) => {
  try {
    const tag = encodeURIComponent("#" + req.params.tag);
    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${tag}/members`,
      {
        headers: {
          Authorization: `Bearer ${getNextKey()}`,
          
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch members" });
  }
});

// Example route: get current war info
app.get("/clan/:tag/currentwar", async (req, res) => {
  try {
    const tag = encodeURIComponent("#" + req.params.tag);
    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${tag}/currentwar`,
      {
        headers: {
          Authorization: `Bearer ${getNextKey()}`,
        },
      }
    );

    res.json(response.data); // send full war data to frontend
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch current war data" });
  }
});


// Example route: get clan members
app.get("/clan/:tag/capitalraidseasons", async (req, res) => {
  try {
    const tag = encodeURIComponent("#" + req.params.tag);
    const response = await axios.get(
      `https://api.clashofclans.com/v1/clans/${tag}/capitalraidseasons`,
      {
        headers: {
          Authorization: `Bearer ${getNextKey()}`,
          
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch capital raid" });
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});