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

// Serve the land HTML file as the landing page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "land.html"));
});

// Serve the index HTML file
app.get("/index", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Serve the recommendations HTML file
app.get("/recommendations", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "recommendation.html"));
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
    model: "gemini-2.0-flash",
    geminiConfig,
});

// Handle form submission
app.post("/submit", async (req, res) => {
    const {
        budget,
        useCase,
        cpuBrand,
        gpuBrand,
        cpuModel = "none",
        gpuModel = "none",
        storage,
        ram,
    } = req.body;

    const prompt = `Generate 2 or 3 PC part lists for the following requirements:
    Total Budget: ${budget}
    Use Case: ${useCase}
    Preferred CPU Brand: ${cpuBrand}
    Preferred GPU Brand: ${gpuBrand}
    CPU Model: ${cpuModel}
    GPU Model: ${gpuModel}
    Storage: ${storage}
    RAM: ${ram}
    
    Display the input requirements at the beginning of the list.

    The Approximate price for each component should be taken from sources like Amazon, Newegg, etc and in INR.
    Recommending older parts is also fine, the performance per rupee is more important.
    The Total Estimated Cost must be equal to ${budget}.
    Never Recommend a PC Parts list which exceeds the budget of ${budget}. The budget is only for the PC peripherals have another budget.
    The use case for the PC is ${useCase}.
    No "-" should be used between the model numeber and brand name.

    If the cpuModel and gpu Model vary from the Brand Preference mentioned, generate a list with the Brand Preference and another list with the Model Preference.
    
    Generate 2 or 3 PC part lists and explain each one's advantages and disadvantages. Let the user decide which one he wants.
    
    Only provide a small explanation at the end of each list, Don't write the word "Note:". Stick to this format strictly
    
    The list should include the following components in this order (No explanation beside part name, only approx price)):
    1. **CPU**: Name - Price
    2. **GPU**: Name - Price
    3. **Motherboard**: Name - Price
    4. **RAM**: Name - Price
    5. **Storage**: Name - Price
    6. **Case:** Name - Price
    7. **Power Supply**: Name - Price
    8. **CPU Cooler**: Name - Price (or stock CPU cooler if applicable)

    **Total Estimated Cost: ** `;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();

        // Store the entire response in localStorage
        res.send(`
            <script>
                localStorage.removeItem("pcBuilderData");
                localStorage.setItem("pcBuilderData", ${JSON.stringify(
                    responseText
                )});
                window.location.href = "/recommendations";
            </script>
        `);
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).send("Error generating content");
    }
});

// Handle bottleneck calculation
app.post("/calculate-bottleneck", async (req, res) => {
    const { cpu, gpu } = req.body;

    const prompt = `Calculate the bottleneck percentage for the following components:
    CPU: ${cpu}
    GPU: ${gpu}
    
    Only give the bottleneck percentage.
    The closer to 0% the better and closer to 100% the worse.
    As next paragraph give a small explanation of the bottleneck percentage and which component is causing the bottleneck.
    If the GPU is just used for a display output mention it in the explaination and that the bottleneck can be ignored as the PC is not used for gaming.
    
    The format of the output should be:
    Bottleneck Percentage: 10% (leave a line break here)
    
    Explanation: The CPU is causing a bottleneck in this system. The GPU is not fully utilized due to the CPU's performance. This bottleneck can be ignored if the GPU is only used for display output.`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text().trim();

        res.json({ bottleneckPercentage: responseText });
    } catch (error) {
        console.error("Error calculating bottleneck:", error);
        res.status(500).send("Error calculating bottleneck");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
