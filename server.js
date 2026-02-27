//Bismillah
const express = require('express');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON bodies
app.use(express.json());

app.post('/api/extract-links', async (req, res) => {
  try {
    const { urls } = req.body;

    // Validate the input
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: "Please provide a valid array of 'urls'." });
    }

    const uniqueLinks = new Set(); // Using a Set to automatically prevent duplicates across all URLs

    // Fetch and process all URLs concurrently for better performance
    await Promise.all(urls.map(async (url) => {
      try {
        const response = await fetch(url);
        
        if (!response.ok) {
          console.warn(`[WARNING] Failed to fetch ${url} - Status: ${response.status}`);
          return; // Skip to the next URL if this one fails
        }
        
        const htmlString = await response.text();
        
        // Load the HTML into Cheerio
        const $ = cheerio.load(htmlString);

        // Select the links using the bulletproof CSS selector
        $('#cagetory li a').each((index, element) => {
          const href = $(element).attr('href');
          
          // Validate it's a real link before adding
          if (href && href.startsWith('http')) {
            uniqueLinks.add(href.trim());
          }
        });

      } catch (fetchError) {
        console.error(`[ERROR] Could not process ${url}:`, fetchError.message);
      }
    }));

    // Convert the Set into your required array of objects format
    const outputArray = Array.from(uniqueLinks).map(link => ({ Link: link }));

    // Send the final response
    return res.json(outputArray);

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running and listening on http://localhost:${PORT}`);
});
