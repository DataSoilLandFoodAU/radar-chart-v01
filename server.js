require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for all requests

// Environment Variables
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const ZOHO_SHEET_ID = process.env.ZOHO_SHEET_ID;
const ZOHO_API_BASE = "https://www.zohoapis.com.au/sheet/api/v2";

// Store access token in memory
let accessToken = "";

/**
 * Function to get a new Access Token using the Refresh Token
 */
const getAccessToken = async () => {
    try {
        const response = await axios.post("https://accounts.zoho.com/oauth/v2/token", null, {
            params: {
                
                refresh_token: REFRESH_TOKEN,
                grant_type: "refresh_token",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }
        });

        accessToken = response.data.access_token;
        console.log("✅ New Access Token Obtained:", accessToken);
        return accessToken;
    } catch (error) {
        console.error("❌ Error Getting Access Token:", error.response ? error.response.data : error.message);
        throw new Error("Failed to get access token.");
    }
};

/**
 * Fetch Data from Zoho Sheet
 */
const fetchZohoSheetData = async () => {
    try {
        if (!accessToken) {
            await getAccessToken(); // Get token if it's not set
        }

        const url = `${ZOHO_API_BASE}/${ZOHO_SHEET_ID}?method=worksheet.records.fetch`;

        const response = await axios.post(url, null, {
            params: {
                worksheet_id: 1
            },
            headers: {
                "Authorization": `Zoho-oauthtoken ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        return response.data;
    } catch (error) {
        console.error("❌ Error Fetching Zoho Sheet Data:", error.response ? error.response.data : error.message);
        throw new Error("Failed to fetch data from Zoho Sheet.");
    }
};

// ✅ API Route: Fetch Zoho Sheet Data
app.get('/fetch-data', async (req, res) => {
    try {
        const data = await fetchZohoSheetData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch data from Zoho." });
    }
});

// ✅ API Route: Manually Refresh Access Token
app.get('/refresh-token', async (req, res) => {
    try {
        const token = await getAccessToken();
        res.json({ 
            message: "New access token obtained!", 
            access_token: token 
        });  // ✅ Now includes the token in the response
    } catch (error) {
        res.status(500).json({ error: "Failed to refresh token." });
    }
});

// ✅ Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});