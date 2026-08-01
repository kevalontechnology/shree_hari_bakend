require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const shipmentRoutes = require('./routes/shipments');
const settingsRoutes = require('./routes/settings');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');
const path = require('path');
const templateRoutes = require("./routes/templateRoutes");
const notificationRoutes = require("./routes/notifications");
const errorHandler = require("./middleware/errorMiddleware");
const uploadRoutes = require("./routes/uploadRoutes");
const masterFormRoutes = require("./routes/masterFormRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://shree-hari-frontend.onrender.com',
  'https://sh-7wsb.onrender.com',
  'https://shree-hari-bakendx.onrender.com',
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json()); // Allow backend to accept JSON data

// Root Route to prevent "Cannot GET /"
app.get('/', (req, res) => {
  res.send('Welcome to Shree Hari CRM API! Backend is running successfully.');
});
app.use("/api/templates", templateRoutes);
// Routes
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/master-form', masterFormRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use("/api/upload", uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(errorHandler);

// Database Connection & Server Start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error connecting to MongoDB:', error.message);
  });   