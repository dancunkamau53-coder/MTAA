const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/user.routes");
const propertyRoutes = require("./routes/propertyRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());

app.use(express.json());

// ===============================
// STATIC FILES
// PROPERTY IMAGES
// ===============================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

// ===============================
// HEALTH CHECK
// ===============================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MTAA API is running",
    version: "1.0.0",
  });
});

// ===============================
// API TEST
// ===============================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "MTAA backend is working!",
  });
});

// ===============================
// AUTH ROUTES
// ===============================

app.use(
  "/api/auth",
  authRoutes
);

// ===============================
// USER ROUTES
// ===============================

app.use(
  "/api/users",
  userRoutes
);

// ===============================
// PROPERTY ROUTES
// ===============================

app.use(
  "/api/properties",
  propertyRoutes
);

// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
  console.error(
    "❌ Server Error:",
    err
  );

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message ||
      "Internal server error",
  });
});

// ===============================
// START SERVER
// ===============================

const server = app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      "================================="
    );

    console.log(
      "🚀 MTAA API SERVER"
    );

    console.log(
      "================================="
    );

    console.log(
      `📡 Port: ${PORT}`
    );

    console.log(
      `🌐 Server: http://localhost:${PORT}`
    );

    console.log(
      "📁 Uploads: /uploads"
    );

    console.log(
      "================================="
    );
  }
);

// ===============================
// SERVER ERROR
// ===============================

server.on(
  "error",
  (error) => {
    console.error(
      "❌ SERVER ERROR:",
      error
    );
  }
);
