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
const ZOHO_API_BASE = "https://sheet.zoho.com.au/api/v2";

// Store access token in memory
let accessToken = "";

/**
 * Function to get a new Access Token using the Refresh Token
 */
const getAccessToken = async () => {
    try {
        const response = await axios.post("https://accounts.zoho.com.au/oauth/v2/token", null, {
            params: {
                refresh_token: REFRESH_TOKEN,
                grant_type: "refresh_token",
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET
            }
        });

        console.log("🔍 Zoho Response Data:", response.data); // Debugging log

        if (response.data.access_token) {
            accessToken = response.data.access_token;
            console.log("✅ New Access Token Obtained:", accessToken);
            return accessToken;
        } else {
            console.error("❌ No access token found in response.");
            throw new Error("No access token received.");
        }
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

        const url = `${ZOHO_API_BASE}/${ZOHO_SHEET_ID}`;

        console.log("🔍 Fetching data from:", url);

        const response = await axios.post(url, {
            "method": "worksheet.records.fetch",
            "worksheet_name": "Input"
        }, {
            headers: {
                "Authorization": `Zoho-oauthtoken ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        console.log("✅ Zoho Sheet Data:", response.data);
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
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to fetch data from Zoho." });
    }
});

// ✅ API Route: Manually Refresh Access Token
app.get('/refresh-token', async (req, res) => {
    try {
        const token = await getAccessToken();

        console.log("📌 Response to Client:", { 
            message: "New access token obtained!", 
            access_token: token 
        });

        res.json({ 
            message: "New access token obtained!", 
            access_token: token 
        }); 
    } catch (error) {
        console.error("❌ Error in /refresh-token route:", error);
        res.status(500).json({ error: "Failed to refresh token." });
    }
});

// ✅ Start the Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});