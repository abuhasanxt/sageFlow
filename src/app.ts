
import express, { Application, Request, Response } from "express"
import { indexRoutes } from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/globalErrorHandler";
import cookieParser from "cookie-parser";
import cron from "node-cron"
import { prisma } from "./lib/prisma";
const app: Application = express();

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser())
//  Expired OTP cleanup 
cron.schedule("* * * * *", async () => {
  try {
    const result = await prisma.emailVerification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    console.log(`Expired OTP deleted: ${result.count}`);
  } catch (error) {
    console.error("OTP cleanup failed:", error);
  }
});
app.use("/",indexRoutes)
// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Sage Flow API!');
});
app.use(errorHandler)
app.use(notFound)
export default app;