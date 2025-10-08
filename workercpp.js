import { createClient } from "redis";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

async function ensureTempDirectoryExists() {
  const tempDir = path.resolve("./temp");
  try {
    await fs.access(tempDir);
    //console.log("Temp directory exists");
  } catch {
    //console.log("Temp directory does not exist. Creating it...");
    await fs.mkdir(tempDir, { recursive: true });
    //console.log("Temp directory created");
  }
}

async function dataWorker() {
  try {
    await client.connect();
    //console.log("Redis connected to worker node");

    const pubClient = client.duplicate();
    await pubClient.connect();

    // Ensure the temp directory exists
    await ensureTempDirectoryExists();

    while (true) {
      try {
        // Blocking operation to retrieve tasks from the "data-cpp" queue
        const taskData = await client.brPop("data-cpp", 0);
        const task = JSON.parse(taskData.element);

        //console.log("C++ task received:", task);

        const cppCode = task.code; // Extract C++ code
        const fileName = `temp_${Date.now()}.cpp`; // Temporary file name
        const filePath = path.resolve("./temp", fileName);

        // Write C++ code to a temporary file
        await fs.writeFile(filePath, cppCode);
        //console.log(`C++ code written to file: ${filePath}`);

        // Docker command to compile and run the C++ code
        const dockerCommand = `
        docker run --rm \
        -v ${path.resolve("./temp")}:/usr/src/app \
        cpp-executor \
        sh -c "g++ /usr/src/app/${fileName} -o /usr/src/app/output && /usr/src/app/output || echo 'Compilation failed'"
      `;
      //console.log("docker" ,dockerCommand );
      

        // Execute the Docker command
        exec(dockerCommand, async (error, stdout, stderr) => {
          let status = true;
          let result = stdout || stderr;
        
          if (error) {
            console.error("Error executing C++ code:", error);
            status = false;
            result = stderr || error.message;
          } else if (!stdout && !stderr) {
            console.error("No output from Docker execution");
            status = false;
            result = "No output generated from C++ code.";
          }
        
          // Log results
          //console.log("Docker execution result:", result);
        
          // Publish result to Redis
          await pubClient.publish(
            "taskUpdates",
            JSON.stringify({
              clientId: task.clientId,
              result,
              status,
            })
          );
        
          // Clean up temporary file
         // await fs.unlink(filePath);
          //console.log("Temporary file cleaned up:", filePath);
        });
        
      } catch (taskError) {
        console.error("Error processing C++ task:", taskError);
      }
    }
  } catch (error) {
    console.error("Worker node encountered an error:", error);
  }
}

dataWorker();
