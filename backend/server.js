const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// Connect database
connectDB();

app.get("/", (req, res) => {
  res.send("MedSync Backend Running");
});

// Routes will be added later
//app.use("/api/doctors", require("./routes/doctorRoutes"));

app.listen(5000, () => console.log("Server running on port 5000"));
