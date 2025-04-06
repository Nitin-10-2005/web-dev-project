require("dotenv").config()
const express = require("express")
const cors = require("cors")
const nodemailer = require("nodemailer")
const otpGenerator = require("otp-generator")
const Razorpay = require("razorpay")
const crypto = require("crypto")
const path = require("path")

const app = express()
const PORT = process.env.PORT || 5000

// Log environment variables (remove in production)
if (process.env.NODE_ENV !== "production") {
  console.log("Environment:", process.env.NODE_ENV)
  console.log("Razorpay Key ID:", process.env.RAZORPAY_KEY_ID)
}

// ✅ Middleware
app.use(
  cors({
    // Allow requests from any origin in production
    origin: true,
    methods: ["POST", "GET"],
    allowedHeaders: ["Content-Type"],
  }),
)
app.use(express.json())

// Serve static files from the public directory
// This must come BEFORE the API routes
app.use(express.static(path.join(__dirname, "public")))

const otpStore = {} // Temporary storage for OTPs with expiration

// 📧 Email Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
})

// 💰 Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// Function to generate and send OTP
async function generateAndSendOTP(email) {
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false })

  otpStore[email] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes
  }

  // Only log OTP in development environment
  if (process.env.NODE_ENV !== "production") {
    console.log(`Generated OTP for ${email}: ${otp}`)
  }

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is ${otp}. It will expire in 5 minutes.`,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true, message: "OTP sent successfully" }
  } catch (error) {
    console.error("Failed to send OTP:", error)
    return { success: false, message: "Failed to send OTP" }
  }
}

// 📌 API Routes
// Route to Send OTP (Initial & Resend)
app.post("/send-otp", async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: "Email is required" })

  const result = await generateAndSendOTP(email)
  if (result.success) {
    res.json({ message: result.message })
  } else {
    res.status(500).json({ error: result.message })
  }
})

// 📌 Route to Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body

  if (process.env.NODE_ENV !== "production") {
    console.log(`🔍 Verifying OTP for ${email}: ${otp}`)
  }

  if (!otpStore[email]) {
    return res.status(400).json({ error: "No OTP request found for this email." })
  }

  const { otp: storedOTP, expiresAt } = otpStore[email]

  if (Date.now() > expiresAt) {
    delete otpStore[email] // Remove expired OTP
    console.log(`❌ OTP expired for ${email}`)
    return res.status(400).json({ error: "OTP has expired. Please request a new one." })
  }

  if (storedOTP !== otp) {
    console.log(`❌ Invalid OTP entered for ${email}`)
    return res.status(400).json({ error: "Invalid OTP" })
  }

  delete otpStore[email] // ✅ Remove OTP after successful verification
  console.log(`✅ OTP Verified for ${email}`)

  // Return success response
  return res.json({ message: "OTP verified successfully" })
})

// 💰 Create Razorpay Order
app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt = "donation_receipt", notes = {} } = req.body

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" })
    }

    console.log(`Creating order for amount: ${amount}`)

    const options = {
      amount: amount * 100, // amount in paise
      currency,
      receipt,
      notes,
      payment_capture: 1, // Auto-capture payment
    }

    const order = await razorpay.orders.create(options)
    console.log("Order created:", order.id)

    res.json({
      success: true,
      order,
    })
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    res.status(500).json({
      success: false,
      error: "Failed to create order",
    })
  }
})

// 💰 Verify Razorpay Payment
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user_id, amount, email } = req.body

    console.log(`Verifying payment: ${razorpay_payment_id}`)

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex")

    if (generatedSignature === razorpay_signature) {
      console.log("✅ Payment verified successfully")

      // Here you would typically store the donation in your database
      // For now, we'll just return success

      // Send donation confirmation email if user provided email
      if (email) {
        sendDonationConfirmation(email, amount, razorpay_payment_id)
      }

      res.json({
        success: true,
        message: "Payment verified successfully",
        payment_id: razorpay_payment_id,
      })
    } else {
      console.log("❌ Payment verification failed")
      res.status(400).json({
        success: false,
        error: "Invalid signature",
      })
    }
  } catch (error) {
    console.error("Error verifying payment:", error)
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
    })
  }
})

// Function to send donation confirmation email
async function sendDonationConfirmation(email, amount, paymentId) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Thank You for Your Donation",
    text: `Thank you for your generous donation of ₹${amount}! Your payment (ID: ${paymentId}) has been successfully processed. Your contribution will make a real difference.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #3399cc;">Thank You for Your Donation!</h2>
        <p>Dear Donor,</p>
        <p>We are grateful for your generous donation of <strong>₹${amount}</strong>.</p>
        <p>Your payment (ID: ${paymentId}) has been successfully processed.</p>
        <p>Your contribution will help us continue our mission and make a real difference in the communities we serve.</p>
        <p>With gratitude,<br>The Team</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Donation confirmation email sent to ${email}`)
    return true
  } catch (error) {
    console.error("Failed to send donation confirmation email:", error)
    return false
  }
}

// Catch-all route to handle client-side routing
// This must come AFTER all API routes
app.get("*", (req, res) => {
  // Check if the request is for a file with an extension
  const fileExtension = path.extname(req.path);
  
  if (fileExtension) {
    // If it's a file with extension, try to serve it from public
    const filePath = path.join(__dirname, "public", req.path);
    res.sendFile(filePath, (err) => {
      if (err) {
        // If file not found, fall back to index.html
        res.sendFile(path.join(__dirname, "public", "index.html"));
      }
    });
  } else {
    // For routes without file extension, serve index.html
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
})

// Start the server if running directly
if (require.main === module) {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
}

// Export the Express API for Vercel
module.exports = app