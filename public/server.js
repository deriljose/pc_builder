// server.js
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files from the 'public' directory

// Serve the HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Handle form submission
app.post("/submit", async (req, res) => {
    const { budget, useCase, cpuBrand, gpuBrand } = req.body;

    // Example API call to Gemini (replace with actual API endpoint and parameters)
    try {
        const response = await axios.post(
            "https://api.gemini.com/v1/some-endpoint",
            {
                budget,
                useCase,
                cpuBrand,
                gpuBrand,
            }
        );

        // Send the response data back to the client
        res.json(response.data);
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        res.status(500).send("Error communicating with the API");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
