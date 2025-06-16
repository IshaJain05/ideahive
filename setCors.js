const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: "ideahive-68b9a.appspot.com"  // CHANGE THIS to your actual bucket if needed
});

const bucket = admin.storage().bucket();

const corsConfiguration = [{
  origin: ["http://localhost:3000"],
  method: ["GET", "POST", "PUT", "DELETE"],
  maxAgeSeconds: 3600
}];

bucket.setCorsConfiguration(corsConfiguration)
  .then(() => {
    console.log("✅ CORS configuration applied successfully.");
  })
  .catch((err) => {
    console.error("❌ Error setting CORS:", err.message);
  });
