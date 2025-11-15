import app from "./app.js";
import { env } from "./src/config/env.js"; 
import rewardRouter from "./src/routes/rewardRoutes.js";
const PORT = env.port;

app.use("/reward",rewardRouter)
// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${env.nodeEnv} mode on port ${PORT}`);
});
