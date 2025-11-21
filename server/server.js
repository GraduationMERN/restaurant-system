import app from "./app.js";
import { env } from "./src/config/env.js"; 

const PORT = env.port;



// Start server

app.listen(PORT, () => {
  console.log(`Server running in ${env.nodeEnv} http://localhost:${PORT}`);
});
