const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for all requests
app.use(cors());

// Route to manually get an access token
app.get("/get-token", async (req, res) => {
  try {
    const response = await axios.post("https://accounts.zoho.com.au/oauth/v2/token", null, {
      params: {
        code: process.env.AUTH_CODE,
        grant_type: "authorization_code",
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: process.env.ZOHO_REDIRECT_URI,
      },
    });

    res.json(response.data); // Return access_token & refresh_token
  } catch (error) {
    res.status(500).json({ error: "Failed to get access token", details: error.response?.data || error.message });
  }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));