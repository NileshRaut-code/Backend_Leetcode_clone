import { createClient } from "redis";
import { VM } from "vm2";

const client = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379", 
});

async function dataWorker() {
  try {
    await client.connect();
    console.log("Redis connected to worker node");

    const pubClient = client.duplicate();
    await pubClient.connect();

    const vm = new VM({
      timeout: 1000, 
      sandbox: {},   
    });

    while (true) {
      try {
        const taskData = await client.brPop('data-js', 0);
        const task = JSON.parse(taskData.element);

        console.log("Task received for execution:", task);

        let resultexe;
        let status = true;

        try {
          resultexe = vm.run(task.code, 'vm.js');
        } catch (error) {
          status = false; 
          console.error("Execution error:", error);
          resultexe = `Error: ${error.message}`;
        }

        console.log("Task execution result:", resultexe);

        const result = `Processed task for ${task.name}, output of the code: ${resultexe}`;

        setTimeout(async () => {
          await pubClient.publish("taskUpdates", JSON.stringify({
            clientId: task.clientId,
            result,
            output: resultexe,
            status,
          }));
        }, 2000); 

        console.log("Published task result:", result);
      } catch (taskError) {
        console.error("Error processing task:", taskError);
      }
    }
  } catch (error) {
    console.error("Worker node encountered an error:", error);
  }
}

dataWorker();
