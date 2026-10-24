// Vercel runs this as a serverless function; vercel.json routes /api/* here.
// It's the same app as `yarn start`, configured from Vercel's environment variables.
import { appFromEnv } from "../server/src/compose.js";

export default appFromEnv(process.env).app;
