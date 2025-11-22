import app from "./app.js";
import { env } from "./src/config/env.js"; 

const PORT = env.port;
app.get("/", (req, res) => {
    res.json({ message: "Server is running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running in ${env.nodeEnv} mode on port ${PORT}`);
});
