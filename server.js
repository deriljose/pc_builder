const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

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

const gemini_api_key = process.env.API_KEY;
const googleAI = new GoogleGenerativeAI(gemini_api_key);
const geminiConfig = {
    temperature: 0.9,
    topP: 1,
    topK: 1,
    maxOutputTokens: 4096,
};

const geminiModel = googleAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    geminiConfig,
});

// Handle form submission
app.post("/submit", async (req, res) => {
    const { budget, useCase, cpuBrand, gpuBrand } = req.body;

    const prompt = `Generate a PC part list for the following requirements:
    Budget: ${budget}
    Use Case: ${useCase}
    Preferred CPU Brand: ${cpuBrand}
    Preferred GPU Brand: ${gpuBrand}
    
    The list should include the following components in this order:
    1. CPU
    2. GPU
    3. Motherboard
    4. RAM
    5. Storage
    6. Case
    7. Power Supply
    8. CPU Cooler (or stock CPU cooler if applicable)
    
    Please provide a small explanation at the end of the list.`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();

        // Redirect to recommendations page with response data
        res.redirect(
            `/recommendations?data=${encodeURIComponent(responseText)}`
        );
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).send("Error generating content");
    }
});

// Serve the recommendations HTML file
app.get("/recommendations", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "recommendation.html"));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
