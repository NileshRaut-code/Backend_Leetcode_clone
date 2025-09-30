import express from "express";
import { createClient } from "redis";
import { WebSocketServer } from "ws";
import path from "path";
import http from "http";
import cors from "cors";

const app = express();
app.use(express.json({ limit: "16kb" }));

app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3001",
      credentials: true,
    })
  );
const redisClient = createClient({
 url: process.env.REDIS_URL || "redis://localhost:6379"
});
redisClient.on('error', (err) => console.log('Redis Client Error', err));

const pubSubClient = redisClient.duplicate();
const __dirname = path.resolve(path.dirname(''));

app.get('/leetcode', (req, res) => {
    res.sendFile(__dirname + '/public/leetcode.html');
});

app.post("/send", async (req, res) => {
    //console.log(req.body);
    
    const { name, year, language, clientId } = req.body;
    const taskData = { name, year, language, clientId };
    console.log("started",language);
    console.log("Task received on server and sent to the queue");

    try {
        await redisClient.lPush(`data-${year}`, JSON.stringify(taskData));
        res.status(200).send("Submission received and stored.");
    } catch (error) {
        console.error("Redis error:", error);
        res.status(500).send("Failed to store submission.");
    }
});

const server = http.createServer(app);

const wss = new WebSocketServer({ server });
const connectedClients = new Map();

wss.on('connection', (ws, req) => {
    const clientId =req.url?.split('?clientId=')[1];

    if (clientId) {
        // console.log(ws.id);
        console.log(ws);
        
        connectedClients.set(clientId, ws);
        console.log(`Client ${clientId} connected via WebSocket`);

        ws.on('close', () => {
            connectedClients.delete(clientId);
            console.log(`Client ${clientId} disconnected`);
        });
    }
});

async function startServer() {
    try {
        await redisClient.connect();
        await pubSubClient.connect();
        console.log("Connected to Redis");

        await pubSubClient.subscribe("taskUpdates", (message) => {
            //console.log("taskupdate calling",JSON.parse(message))
            const { clientId, result,output ,status } = JSON.parse(message);

            const ws = connectedClients.get(clientId);
           // console.log(ws);
            
            if (ws && ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ result, output,status}));
                console.log(`Result sent to client ${clientId}`);
            }
        });

        const PORT = process.env.PORT || 3001;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}

startServer();
