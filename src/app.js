import express from "express";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Acquisitions API!" });
});

export default app;
