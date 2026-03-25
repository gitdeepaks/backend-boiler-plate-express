import "dotenv/config";
import { app } from "./src/app.js";
import { connectDB } from "./src/common/config/db.js";

const PORT = process.env.PORT || 5000;

const start = async () => {
  //connect to DB
  await connectDB();
  app.listen(PORT, () =>
    console.log(`Server is running at ${PORT} in ${process.env.NODE_ENV}`),
  );
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
