// auth.js - Handles authentication functionality

// Get the base API URL based on environment
const getApiUrl = () => {
  // In production, use relative URLs
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : ""
}

// Mock database for users (in a real app, this would be on a server)
const users = JSON.parse(localStorage.getItem("users")) || []
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null

// Check if user is logged in
function checkAuth() {
  if (!currentUser) {
    if (window.location.pathname.includes("dashboard.html")) {
      window.location.href = "login.html"
    }
  } else {
    if (window.location.pathname.includes("login.html")) {
      window.location.href = "dashboard.html"
    }
    updateLoginStatus()
  }
}

// Update login status in header
function updateLoginStatus() {
  const navList = document.querySelector("nav ul")
  if (navList) {
    const existingLoginLink = navList.querySelector('a[href="login.html"]')
    const existingDashboardLink = navList.querySelector('a[href="dashboard.html"]')

    if (currentUser) {
      if (existingLoginLink) {
        existingLoginLink.parentElement.innerHTML = '<a href="dashboard.html">Dashboard</a>'
      } else if (!existingDashboardLink) {
        const li = document.createElement("li")
        li.innerHTML = '<a href="dashboard.html">Dashboard</a>'
        navList.appendChild(li)
      }
    } else {
      if (existingDashboardLink) {
        existingDashboardLink.parentElement.innerHTML = '<a href="login.html">Login</a>'
      } else if (!existingLoginLink) {
        const li = document.createElement("li")
        li.innerHTML = '<a href="login.html">Login</a>'
        navList.appendChild(li)
      }
    }
  }
}

// Send OTP to email
async function sendOTP(email) {
  try {
    const response = await fetch(`${getApiUrl()}/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }), // Only send email, server generates OTP
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`OTP sent to ${email}`)
      showNotification("OTP sent successfully. Check your email.")
      return true
    } else {
      console.error("Failed to send OTP:", data.error)
      showNotification("Failed to send OTP. Please try again.", "error")
      return false
    }
  } catch (error) {
    console.error("Error sending OTP:", error)
    showNotification("Error sending OTP. Please try again.", "error")
    return false
  }
}

// Show notification
function showNotification(message, type = "success") {
  const existingNotification = document.querySelector(".notification")
  if (existingNotification) existingNotification.remove()

  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.textContent = message

  const activeTab = document.querySelector(".tab-content.active")
  const activeStep = activeTab.querySelector(".auth-step.active")

  activeStep.insertBefore(notification, activeStep.firstChild)

  setTimeout(() => {
    notification.remove()
  }, 5000)
}

// Initialize auth functionality
function initAuth() {
  if (window.location.pathname.includes("login.html")) {
    const tabBtns = document.querySelectorAll(".tab-btn")
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"))
        document.querySelectorAll(".tab-content").forEach((content) => content.classList.remove("active"))

        btn.classList.add("active")
        document.getElementById(btn.dataset.tab).classList.add("active")

        document.querySelectorAll(".auth-step").forEach((step) => step.classList.remove("active"))
        document.querySelectorAll(".auth-step:first-child").forEach((step) => step.classList.add("active"))

        document.querySelectorAll(".notification").forEach((notification) => notification.remove())
      })
    })

    // Login form submission
    const loginForm = document.getElementById("login-form")
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()
      const email = document.getElementById("login-email").value

      const user = users.find((u) => u.email === email)
      if (!user) {
        showNotification("Email not found. Please register first.", "error")
        return
      }

      const otpSent = await sendOTP(email)
      if (otpSent) {
        document.getElementById("login-step-1").classList.remove("active")
        document.getElementById("login-step-2").classList.add("active")
      }
    })

    // OTP verification for login
    document.getElementById("verify-login-otp-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const email = document.getElementById("login-email").value
      const otp = document.getElementById("login-otp").value

      try {
        const response = await fetch(`${getApiUrl()}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        })

        const data = await response.json()

        if (response.ok) {
          const user = users.find((u) => u.email === email)
          localStorage.setItem("currentUser", JSON.stringify(user || { email }))
          window.location.href = "dashboard.html" // Redirect after success
        } else {
          showNotification(data.error, "error")
        }
      } catch (error) {
        console.error("OTP Verification Error:", error)
        showNotification("Failed to verify OTP. Try again.", "error")
      }
    })

    // Resend OTP for login
    document.getElementById("resend-login-otp").addEventListener("click", async (e) => {
      e.preventDefault()
      const email = document.getElementById("login-email").value

      await sendOTP(email)
    })

    // Register form submission
    document.getElementById("register-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const name = document.getElementById("register-name").value
      const email = document.getElementById("register-email").value
      const phone = document.getElementById("register-phone").value

      if (users.find((u) => u.email === email)) {
        showNotification("Email already registered. Please login.", "error")
        return
      }

      // Store user data temporarily
      sessionStorage.setItem("pendingUser", JSON.stringify({ name, email, phone }))

      const otpSent = await sendOTP(email)
      if (otpSent) {
        document.getElementById("register-step-1").classList.remove("active")
        document.getElementById("register-step-2").classList.add("active")
      }
    })

    // OTP verification for register
    document.getElementById("verify-register-otp-form").addEventListener("submit", async (e) => {
      e.preventDefault()
      const pendingUser = JSON.parse(sessionStorage.getItem("pendingUser"))
      const email = pendingUser.email
      const otp = document.getElementById("register-otp").value

      try {
        const response = await fetch(`${getApiUrl()}/verify-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        })

        const data = await response.json()

        if (response.ok) {
          // Add user to local storage
          users.push(pendingUser)
          localStorage.setItem("users", JSON.stringify(users))

          // Set as current user
          localStorage.setItem("currentUser", JSON.stringify(pendingUser))

          // Clear pending user
          sessionStorage.removeItem("pendingUser")

          // Redirect to dashboard
          window.location.href = "dashboard.html"
        } else {
          showNotification(data.error, "error")
        }
      } catch (error) {
        console.error("OTP Verification Error:", error)
        showNotification("Failed to verify OTP. Try again.", "error")
      }
    })

    // Resend OTP for register
    document.getElementById("resend-register-otp").addEventListener("click", async (e) => {
      e.preventDefault()
      const pendingUser = JSON.parse(sessionStorage.getItem("pendingUser"))
      const email = pendingUser.email

      await sendOTP(email)
    })
  }

  if (window.location.pathname.includes("dashboard.html")) {
    const logoutBtn = document.getElementById("logout-btn")
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        currentUser = null
        localStorage.removeItem("currentUser")
        window.location.href = "index.html"
      })
    }
  }
}

// Run auth check on page load
document.addEventListener("DOMContentLoaded", () => {
  checkAuth()
  initAuth()
  updateLoginStatus()
})

