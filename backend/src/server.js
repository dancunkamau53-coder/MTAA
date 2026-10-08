const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

// ==========================================
// ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/user.routes");
const propertyRoutes = require("./routes/propertyRoutes");
const propertyInteractionRoutes = require("./routes/propertyInteractionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

// ==========================================
// APP
// ==========================================

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================================
// UPLOADS
// ==========================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

// ==========================================
// HOME ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MTAA API is running",
    version: "1.0.0",
  });
});

// ==========================================
// TEST ROUTE
// ==========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "MTAA backend is working!",
  });
});

// ==========================================
// AUTH ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

// ==========================================
// USER ROUTES
// ==========================================

app.use(
  "/api/users",
  userRoutes
);

// ==========================================
// NOTIFICATION ROUTES
// ==========================================

app.use(
  "/api/notifications",
  notificationRoutes
);

// ==========================================
// SERVICE ROUTES
// ==========================================

app.use(
  "/api/services",
  serviceRoutes
);

// ==========================================
// PROPERTY ROUTES
// ==========================================

app.use(
  "/api/properties",
  propertyRoutes
);

// ==========================================
// PROPERTY INTERACTION ROUTES
//
// Likes
// Saves
// Comments
// ==========================================

app.use(
  "/api/properties",
  propertyInteractionRoutes
);

// ==========================================
// REVIEWS & RATINGS
//
// Add review
// Get property reviews
// Get user reviews
// Edit review
// Delete review
// ==========================================

app.use(
  "/api/reviews",
  reviewRoutes
);

// ==========================================
// 404 ROUTE
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
  (err, req, res, next) => {
    console.error(
      "❌ Server Error:",
      err
    );

    res.status(
      err.status || 500
    ).json({
      success: false,
      message:
        err.message ||
        "Internal server error",
    });
  }
);

// ==========================================
// START SERVER
// ==========================================

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
      "❤️ Likes: ENABLED"
    );

    console.log(
      "🔖 Saves: ENABLED"
    );

    console.log(
      "💬 Comments: ENABLED"
    );

    console.log(
      "⭐ Reviews: ENABLED"
    );

    console.log(
      "================================="
    );
  }
);

// ==========================================
// SERVER ERROR
// ==========================================

server.on(
  "error",
  (error) => {
    console.error(
      "❌ SERVER ERROR:",
      error
    );
  }
);