const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const loginRoute = require('./routes/login');
const registerPatientRoute = require('./routes/registerpatient');
const registerDriverRoute = require('./routes/registerdriver');
const registerDoctorRoute = require('./routes/registerdoctor');
const driverRoutes = require('./routes/driver');
const sosRoutes = require('./routes/sos');
const hospitalRoutes = require('./routes/hospital');
const doctorRoutes = require('./routes/doctorRoutes');
const adminDashboardRoutes = require('./routes/adminDashboard');
const rushRoutes = require('./routes/rushRoutes');
const ambulanceRoutes = require('./routes/ambulanceRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const alertsRoutes = require('./routes/alertsRoutes');
const chatbotRoutes = require('./routes/chatbot');

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// Connect database
connectDB();

app.get('/', (req, res) => {
  res.send('MedSync Backend Running');
});

// Routes
app.use('/login', loginRoute);
app.use('/registerpatient', registerPatientRoute);
app.use('/registerdriver', registerDriverRoute);
app.use('/registerdoctor', registerDoctorRoute);
app.use('/driver', driverRoutes);
app.use('/sos', sosRoutes);
app.use('/hospital', hospitalRoutes);
app.use('/doctor', doctorRoutes);
app.use('/admin/dashboard', adminDashboardRoutes);
app.use('/admin/rush', rushRoutes);
app.use('/admin/ambulance', ambulanceRoutes);
app.use('/settings', settingsRoutes);
app.use('/alerts', alertsRoutes);
app.use('/app', chatbotRoutes);
// app.use("/api/doctors", require("./routes/doctorRoutes"));

app.listen(5000, () => console.log('Server running on port 5000'));
