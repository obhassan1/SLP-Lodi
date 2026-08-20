require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const patientRoutes = require('./routes/patient.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const { requireAuth } = require('./middleware/auth.middleware');
const statisticsRoutes = require('./routes/statistics.routes');

const app = express();

/* =========================================================
   CORS
========================================================= */

const allowedOrigins = [
  'http://localhost:4200',

  // Production custom domain
  'https://slplodithebian.com',
  'https://www.slplodithebian.com',

  // Render frontend
  'https://slp-lodi-frontend.onrender.com'
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(
    ...process.env.CLIENT_URL
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean)
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools/Postman/server-to-server requests without Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn('Blocked by CORS:', origin);

      return callback(
        new Error(`Origin ${origin} is not allowed by CORS`)
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization'
    ]
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(express.json({ limit: '1mb' }));

/* =========================================================
   API STATUS
========================================================= */

// So https://slp-lodi.onrender.com/api doesn't show Cannot GET /api
app.get('/api', (_req, res) => {
  res.json({
    ok: true,
    service: 'Lodi Speech Therapy API'
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true
  });
});

/* =========================================================
   ROUTES
========================================================= */

app.use('/api/auth', authRoutes);

app.use(
  '/api/users',
  requireAuth,
  userRoutes
);

app.use(
  '/api/patients',
  requireAuth,
  patientRoutes
);

app.use(
  '/api/appointments',
  requireAuth,
  appointmentRoutes
);

app.use(
  '/api/statistics',
  requireAuth,
  statisticsRoutes
);


/* =========================================================
   404 API ROUTE
========================================================= */

app.use('/api', (req, res) => {
  res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`
  });
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((error, _req, res, _next) => {
  console.error(error);

  res.status(error.status || 500).json({
    message: error.message || 'Server error'
  });
});

/* =========================================================
   START SERVER
========================================================= */

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`Speech therapy API ready on port ${port}`);
    });
  })
  .catch(error => {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  });