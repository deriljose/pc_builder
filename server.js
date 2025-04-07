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
MongoClient.connect(MONGO_URI)
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
    let {
        budget,
        useCase,
        cpuBrand,
        gpuBrand,
        cpuModel,
        gpuModel,
        storage,
        ram,
    } = req.body;

    // Set cpuModel and gpuModel to NULL if not provided
    cpuModel = cpuModel || "NULL";
    gpuModel = gpuModel || "NULL";

    const prompt = `Generate a PC part list for the following requirements:
    Total Budget: ${budget}
    Use Case: ${useCase}
    Preferred CPU Brand: ${cpuBrand}
    Preferred GPU Brand: ${gpuBrand}
    Specific CPU Model: ${cpuModel}
    Specific GPU Model: ${gpuModel}
    Preferred Storage: ${storage}
    Preferred RAM: ${ram}
    
    Display the input requirements at the beginning of the list.
    
    The list should include the following components in this order (No explanation beside part name, only approx price)):
    1. **CPU**: Name - Price
    2. **GPU**: Name - Price
    3. **Motherboard**: Name - Price
    4. **RAM**: Name - Price
    5. **Storage**: Name - Price
    6. **Case**: Name - Price
    7. **Power Supply**: Name - Price
    8. **CPU Cooler**: Name - Price (or stock CPU cooler if applicable)

    **Total Estimated Cost: ** 

    The Approximate price for each component should be taken from legitimate sources like Amazon, Newegg, etc and in INR.
    Recommending older parts is also fine, the performance per rupee is more important.
    The Total Estimated Cost must be as close as possible to the budget ${budget}
    Never Recommend a PC Parts list which exceeds the budget of ${budget}
    The use case for the PC is ${useCase}

    The budget has to be met at all costs.
    
    Do not us '-' in the CPU model name.
    Generate 3 PC parts lists that meet all the requirements.
    Each list should be separated by a line break.
    
    Only provide a small explanation at the end of the list, Don't write the word "Note:". Stick to this format strictly.`;

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
    CPU: ${cpu.trim()}
    GPU: ${gpu.trim()}
    
    Only give the bottleneck percentage.
    The closer to 0% the better and closer to 100% the worse.
    As next paragraph give a small explanation of the bottleneck percentage and which component is causing the bottleneck.
    If the GPU is just used for a display output mention it in the explanation and that the bottleneck can be ignored as the PC is not used for gaming.`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text().trim();

        res.json({ bottleneckPercentage: responseText });
    } catch (error) {
        console.error("Error calculating bottleneck:", error);
        res.status(500).json({ error: "Error calculating bottleneck." });
    }
});

// Handle benchmark calculation
app.post("/calculate-benchmark", async (req, res) => {
    const { cpu, gpu } = req.body;

    const prompt = `Provide approximate benchmark scores for the following components:
    CPU: ${cpu}
    GPU: ${gpu}
    
    Format the response as:
    CPU Benchmark
    
    <The scores> (CPU/GPU)

    GPU Benchmark

    <The scores> (CPU/GPU)
    
    Use the latest benchmark scores from reliable sources like PassMark, Cinebench, or 3DMark. Show at least 2 scores for each component from different sources.
    Do not include any other text or explanation and also do not bold any words.
    After "CPU Benchmark" and "GPU Benchmark" write the scores in a new line.
    Follow the format strictly.
    The scores should be in the format of "Source: Score".`;

    try {
        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text().trim();

        res.send(responseText);
    } catch (error) {
        console.error("Error fetching benchmark scores:", error);
        res.status(500).send("Error fetching benchmark scores.");
    }
});

// Handle chat endpoint
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).send({
            result: "error",
            reason: "InvalidInput",
            message: "Message is required",
        });
    }

    try {
        const prompt = `You are a helpful PC Building assistant. 
        Do not encourage any profanity or any other bad behavior.
        Give a short and precise answer to the user.
        Respond to the following message: "${message}"`;

        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text().trim();

        res.status(200).send({ result: "success", response: responseText });
    } catch (error) {
        console.error("Error processing chat message:", error);
        res.status(500).send({
            result: "error",
            reason: "ServerError",
            message: "Error processing chat message",
        });
    }
});

// Handle user registration
app.post("/register", async (req, res) => {
    const { username, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).send("User registered successfully");
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send("Error registering user");
    }
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
        const result = await db
            .collection("users")
            .insertOne({ login_id, password });
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
            password: password.toString(), // Convert password to string for comparison
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

// Serve the recommendations HTML file
app.get("/recommendations", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "recommendation.html"));
});

// Handle game-based building
app.post("/game-build", async (req, res) => {
    const { selectedGames } = req.body; // Array of game names

    try {
        if (!selectedGames || selectedGames.length === 0) {
            console.error("No games selected.");
            return res.status(400).json({ error: "No games selected." });
        }

        // Normalize the selected game names for case-insensitive and trimmed matching
        const normalizedGames = selectedGames.map((game) =>
            game.trim().toLowerCase()
        );

        console.log("Normalized selected games:", normalizedGames);

        // Fetch the minimum requirements for the selected games (case-insensitive match)
        const games = await db
            .collection("gamebuild")
            .find({
                name: {
                    $in: normalizedGames.map(
                        (game) => new RegExp(`^${game}$`, "i")
                    ),
                },
            })
            .toArray();

        if (games.length === 0) {
            console.error("No games found for the given names.");
            return res
                .status(404)
                .json({ error: "No games found for the given names." });
        }

        // Prepare the minimum requirements for Gemini
        const requirements = games.map((game) => game.minimum_requirements);

        const prompt = `Given the following minimum requirements for selected games:
        ${requirements
            .map(
                (req, index) =>
                    `Game ${index + 1}:
        CPU: ${req.cpu}
        GPU: ${req.gpu}
        RAM: ${req.ram}
        Storage: ${req.storage}`
            )
            .join("\n\n")}
        
        Determine the most powerful minimum requirements among these games. Provide the output in the following format:
        CPU: <Most powerful CPU>
        GPU: <Most powerful GPU>
        RAM: <Most powerful RAM>
        Storage: <Most powerful Storage>`;

        const result = await geminiModel.generateContent(prompt);
        const responseText = result.response.text();

        // Send Gemini's output directly to the client
        res.json({ geminiOutput: responseText });
    } catch (error) {
        console.error("Error processing game-based build:", error);
        res.status(500).json({ error: "Error processing game-based build." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
