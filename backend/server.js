const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// Connect database
connectDB();

app.get('/', (req, res) => {
  res.send('MedSync Backend Running');
});

// Routes - require after middleware setup
const loginRoute = require('./routes/login');
const registerPatientRoute = require('./routes/registerpatient');
const sendVerificationRoute = require('./routes/sendVerificationCode');
const verifyCodeRoute = require('./routes/verifyCode');

app.use('/login', loginRoute);
app.use('/registerpatient', registerPatientRoute);
app.use('/send-verification-code', sendVerificationRoute);
app.use('/verify-code', verifyCodeRoute);
// app.use("/api/doctors", require("./routes/doctorRoutes"));

app.listen(5000, () => console.log('Server running on port 5000'));
