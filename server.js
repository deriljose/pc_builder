const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb"); // Import MongoDB client
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection URI and database name
const MONGO_URI = "mongodb://localhost:27017"; // Replace with your MongoDB URI if hosted elsewhere
const DATABASE_NAME = "pcbuilder";

// Connect to MongoDB
let db;
MongoClient.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((client) => {
        console.log("Connected to MongoDB");
        db = client.db(DATABASE_NAME); // Select the database
    })
    .catch((error) => {
        console.error("Error connecting to MongoDB:", error);
    });

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
    model: "gemini-2.0-flash",
    geminiConfig,
});

// Handle form submission
app.post("/submit", async (req, res) => {
    const { budget, useCase, cpuBrand, gpuBrand } = req.body;

    const prompt = `Generate a PC part list for the following requirements:
    Total Budget: ${budget}
    Use Case: ${useCase}
    Preferred CPU Brand: ${cpuBrand}
    Preferred GPU Brand: ${gpuBrand}
    
    Display the input requirements at the beginning of the list.
    
    The list should include the following components in this order (No explanation beside part name, only approx price)):
    1. **CPU**: Name - Price
    2. **GPU**: Name -Price
    3. **Motherboard**: Name - Price
    4. **RAM**: Name - Price
    5. **Storage**: Name - Price
    6. **Case:** Name - Price
    7. **Power Supply**: Name - Price
    8. **CPU Cooler**: Name - Price (or stock CPU cooler if applicable)

    **Total Estimated Cost: ** 

    The Approximate price for each component should be taken from legitimate sources like Amazon, Newegg, etc and in INR.
    Recommending older parts is also fine, the performance per ruppee is more important.
    The Total Estimated Cost must be as close as possible to the budget ${budget}
    Never Recommend a PC Parts list which exceeds the budget of ${budget}
    The use case for the PC is ${useCase}
    
    Only provide a small explanation at the end of the list, Don't write the word "Note:". Stick to this format strictly`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();

        // Store the entire response in localStorage
        res.send(`
            <script>
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
    If the GPU is just used for a display output mention it in the explaination and that the bottleneck can be ignored as the PC is not used for gaming.`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text().trim();

        res.json({ bottleneckPercentage: responseText });
    } catch (error) {
        console.error("Error calculating bottleneck:", error);
        res.status(500).send("Error calculating bottleneck");
    }
});

// Serve the recommendations HTML file
app.get("/recommendations", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "recommendation.html"));
});

// Example route to fetch user data
app.get("/users", async (req, res) => {
    try {
        const users = await db.collection("users").find().toArray(); // Fetch all users
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Error fetching users");
    }
});

// Example route to insert a user
app.post("/users", async (req, res) => {
    const { login_id, password } = req.body;
    try {
        const result = await db.collection("users").insertOne({ login_id, password });
        res.json({ message: "User inserted", userId: result.insertedId });
    } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).send("Error inserting user");
    }
});

// Login route to validate user credentials
app.post("/login", async (req, res) => {
    const { login_id, password } = req.body;

    try {
        // Ensure the password is stored as a string in the database
        const user = await db.collection("users").findOne({ 
            login_id, 
            password: password.toString() // Convert password to string for comparison
        });

        if (user) {
            // If user is found, return success response
            res.json({ message: "Login successful", userId: user._id });
        } else {
            // If user is not found, return error response
            res.status(401).json({ error: "Invalid login_id or password" });
        }
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).send("Error during login");
    }
});

// Serve index.html for successful login redirection
app.get("/index.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
