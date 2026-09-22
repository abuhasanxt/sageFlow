
import app from "./app";
import { envVars } from "./config/env";
import { createQdrantCollection } from "./lib/qdran";
import { redisService } from "./lib/redis";
import { test } from "./lib/test";
import { seedAdmin } from "./utils/seed";

const port = envVars.PORT; // The port your express server will be running on.

// Start the server
const bootstrap = async () => {
  try {
    await seedAdmin()
    await redisService.connect()
    await createQdrantCollection()
    await test()
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server: ", error);
  }
};

bootstrap();
