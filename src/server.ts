
import app from "./app";
import { envVars } from "./config/env";
import { testQdranConnection } from "./lib/qdran";
import { redisService } from "./lib/redis";
import { seedAdmin } from "./utils/seed";

const port = envVars.PORT; // The port your express server will be running on.

// Start the server
const bootstrap = async () => {
  try {
    await seedAdmin()
    await redisService.connect()
    await testQdranConnection()
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server: ", error);
  }
};

bootstrap();
