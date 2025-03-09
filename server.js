require("dotenv").config();
const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const ZOHO_REDIRECT_URI = process.env.ZOHO_REDIRECT_URI;
const ZOHO_SHEET_ID = process.env.ZOHO_SHEET_ID;

let accessToken = null;  // Store access token

// ✅ Step 1: Redirect to Zoho OAuth
app.get("/auth", (req, res) => {
    const authUrl = `https://accounts.zoho.com.au/oauth/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(ZOHO_REDIRECT_URI)}&scope=ZohoSheet.dataAPI.READ&access_type=offline&state=1234`;
    res.redirect(authUrl);
});

// ✅ Step 2: Handle OAuth Callback & Get Access Token
app.get("/oauth/callback", async (req, res) => {
    const authCode = req.query.code;
    if (!authCode) return res.status(400).json({ error: "Missing authorization code" });

    try {
        const response = await axios.post("https://accounts.zoho.com.au/oauth/v2/token", null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                redirect_uri: ZOHO_REDIRECT_URI,
                code: authCode,
                grant_type: "authorization_code"
            },
        });

        accessToken = response.data.access_token;
        res.json({ message: "Authenticated!", access_token: accessToken });
    } catch (error) {
        console.error("Error getting token:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to get access token" });
    }
});

// ✅ Step 3: Fetch Data from Zoho Sheet
app.post("/fetch-data", async (req, res) => {
    if (!accessToken) return res.status(401).json({ error: "Unauthorized. Please authenticate first." });

    try {
        const url = `https://sheet.zoho.com/api/v2/${ZOHO_SHEET_ID}?method=worksheet.records.fetch`;

        const params = {
            worksheet_name: "Sheet1",  // Change to your worksheet name
            header_row: 1,
            render_option: "formatted",
            records_start_index: 1,
            count: 5  // Fetch first 5 rows
        };

        const response = await axios.post(url, new URLSearchParams(params), {
            headers: {
                "Authorization": `Zoho-oauthtoken ${accessToken}`,
                "Content-Type": "application/x-www-form-urlencoded"
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error("Error fetching data:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to fetch data from Zoho" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});