const express = require("express");
const {
  signupValidator,
  loginValidator,
  otpValidator,
} = require("../middlewares/validators");
const {
  signup,
  login,
  verifyOTP,
  resendOTP,
  logout,
  checkSession,
} = require("../controllers/auth.controller");

const router = express.Router();

// Auth routes
router.post("/signup", signupValidator, signup);
router.post("/login", loginValidator, login);
router.post("/verify-otp", otpValidator, verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/logout", logout);
router.get("/check-session", checkSession);

module.exports = router;
