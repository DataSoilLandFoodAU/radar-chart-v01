const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
const PORT = 3000;

// ✅ Enable CORS
app.use(cors());

// ✅ Replace this with your actual Zoho Sheet published URL
const zohoSheetURL = "https://sheet.zohopublic.com.au/sheet/publishedrange/6280ec24648d0c9ee2654ace72b84e51fd928f8037a5f1d5470af6b3fb51a6d7?type=grid";

app.get("/fetch-data", async (req, res) => {
    try {
        // 🔍 Fetch the Zoho Sheet published page
        const response = await axios.get(zohoSheetURL);
        const html = response.data;

        // ✅ Load HTML into Cheerio
        const $ = cheerio.load(html);

        // 🔍 Find table data inside the HTML
        let extractedData = [];
        $("table tbody tr").each((rowIndex, row) => {
            let rowData = [];
            $(row).find("td").each((colIndex, cell) => {
                rowData.push($(cell).text().trim());
            });
            extractedData.push(rowData);
        });

        // ✅ If no table found, try extracting from JavaScript script tags
        if (extractedData.length === 0) {
            let scriptContent = $("script").text();
            const match = scriptContent.match(/RangeGridData\s*=\s*({[\s\S]*?});/);

            if (!match) {
                return res.json({ error: "No table or RangeGridData found in Zoho Sheet" });
            }

            let rawData = match[1];
            rawData = rawData.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').replace(/([a-zA-Z0-9_]+)\s*:/g, '"$1":');

            try {
                extractedData = JSON.parse(rawData);
            } catch (parseError) {
                console.error("❌ JSON Parse Error:", parseError.message);
                return res.status(500).json({ error: "Failed to parse RangeGridData" });
            }
        }

        // ✅ Return extracted cell data
        res.json({ extractedData });

    } catch (error) {
        console.error("❌ Error fetching Zoho Sheet:", error.message);
        res.status(500).json({ error: "Failed to fetch data from Zoho" });
    }
});

// ✅ Start Express Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});