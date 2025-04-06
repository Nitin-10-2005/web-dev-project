// main.js - General website functionality

// Initialize website functionality
document.addEventListener("DOMContentLoaded", () => {
  // Initialize header scroll effect
  initHeaderScroll()

  // Initialize stats counter
  initStatsCounter()

  // Initialize progress bar
  initProgressBar()

  // Initialize donation form
  initDonationForm()

  // Load Razorpay SDK
  loadRazorpayScript()
})

// Load Razorpay SDK
function loadRazorpayScript() {
  const script = document.createElement("script")
  script.src = "https://checkout.razorpay.com/v1/checkout.js"
  script.async = true
  document.body.appendChild(script)
}

// Header scroll effect
function initHeaderScroll() {
  const header = document.querySelector("header")
  if (!header) return

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }
  })
}

// Stats counter animation
function initStatsCounter() {
  const statsNumbers = document.querySelectorAll(".stat-number")
  if (statsNumbers.length === 0) return

  // Get donation data to calculate dynamic stats
  const totalDonations = calculateTotalDonations()

  // Set target values based on donations
  // These are example calculations - adjust based on your actual metrics
  const mealsServed = Math.floor(totalDonations / 50) // Assuming ₹50 per meal
  const communitiesReached = Math.floor(totalDonations / 100000) // Assuming ₹100,000 per community
  const volunteers = Math.floor(totalDonations / 15000) // Assuming ₹15,000 per volunteer

  const targetValues = [mealsServed, communitiesReached, volunteers]

  // Animate the numbers
  statsNumbers.forEach((stat, index) => {
    const targetValue = targetValues[index] || 0
    animateCounter(stat, targetValue)
  })
}

// Animate counter
function animateCounter(element, targetValue) {
  let currentValue = 0
  const duration = 2000 // 2 seconds
  const interval = 20 // Update every 20ms
  const steps = duration / interval
  const increment = targetValue / steps

  const counter = setInterval(() => {
    currentValue += increment
    if (currentValue >= targetValue) {
      currentValue = targetValue
      clearInterval(counter)
    }

    // Format the number with commas
    element.textContent = Math.floor(currentValue).toLocaleString()
  }, interval)
}

// Calculate total donations from all users
function calculateTotalDonations() {
  // Get all users from localStorage
  const users = JSON.parse(localStorage.getItem("users")) || []

  // Calculate total donations
  let totalAmount = 0

  users.forEach((user) => {
    if (user.donations && Array.isArray(user.donations)) {
      user.donations.forEach((donation) => {
        totalAmount += donation.amount || 0
      })
    }
  })

  return totalAmount
}

// Initialize progress bar
function initProgressBar() {
  const progressBar = document.querySelector(".progress")
  if (!progressBar) return

  // Get dynamic values based on actual donations
  const currentAmount = calculateTotalDonations()
  const targetAmount = 7500000 // ₹7,500,000 - this could also be stored in localStorage if needed
  const percentage = Math.min((currentAmount / targetAmount) * 100, 100) // Cap at 100%

  // Update progress bar width and text
  progressBar.style.width = `${percentage}%`
  progressBar.setAttribute("data-progress", `${Math.round(percentage)}%`)

  // Update progress text
  const progressText = document.querySelector(".progress-section p")
  if (progressText) {
    progressText.textContent = `We've raised ₹${currentAmount.toLocaleString()} of our ₹${targetAmount.toLocaleString()} goal`
  }
}

// Initialize donation form
function initDonationForm() {
  const donationForm = document.querySelector(".donation-form")
  if (!donationForm) return

  const amountButtons = donationForm.querySelectorAll(".amount-btn")
  const customAmountInput = document.getElementById("custom-amount")

  // Handle amount button clicks
  amountButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all buttons
      amountButtons.forEach((btn) => btn.classList.remove("active"))

      // Add active class to clicked button
      button.classList.add("active")

      // Show/hide custom amount input
      if (button.textContent === "Custom") {
        customAmountInput.style.display = "block"
        customAmountInput.focus()
      } else {
        customAmountInput.style.display = "none"
      }
    })
  })

  // Handle form submission
  donationForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    // Get current user
    const currentUser = JSON.parse(localStorage.getItem("currentUser"))

    // If user is not logged in, redirect to login page
    if (!currentUser) {
      alert("Please login to make a donation.")
      window.location.href = "login.html"
      return
    }

    // Get donation amount
    let amount = 0
    const activeButton = donationForm.querySelector(".amount-btn.active")

    if (activeButton && activeButton.textContent !== "Custom") {
      // Get amount from button text (remove ₹ symbol)
      amount = Number.parseInt(activeButton.textContent.replace("₹", ""))
    } else {
      // Get amount from custom input
      amount = Number.parseInt(customAmountInput.value)
    }

    // Validate amount
    if (!amount || amount <= 0) {
      alert("Please enter a valid donation amount.")
      return
    }

    try {
      // Create Razorpay order via server
      const orderResponse = await fetch("/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          notes: {
            user_id: currentUser.id,
            user_email: currentUser.email,
          },
        }),
      })

      const orderData = await orderResponse.json()

      if (!orderData.success) {
        throw new Error(orderData.error || "Failed to create order")
      }

      // Initialize Razorpay payment with the order
      initRazorpayPayment(orderData.order, amount, currentUser)
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Failed to process payment. Please try again.")
    }
  })
}

// Initialize Razorpay payment
function initRazorpayPayment(order, amount, user) {
  // Check if Razorpay is loaded
  if (!window.Razorpay) {
    alert("Payment gateway is loading. Please try again in a moment.")
    return
  }

  // Razorpay options
  const options = {
    key: "rzp_test_UypBxGDRzAQBMo", // Replace with your actual Razorpay Key ID (from frontend)
    amount: order.amount, // Amount from the order (in paise)
    currency: order.currency,
    name: "Your Organization Name",
    description: "Donation",
    order_id: order.id,
    image: "/your-logo.png", // Replace with your logo URL
    prefill: {
      name: user.name || "",
      email: user.email || "",
      contact: user.phone || "",
    },
    notes: {
      user_id: user.id,
    },
    theme: {
      color: "#3399cc", // Replace with your brand color
    },
    handler: (response) => {
      // This function is called when payment is successful
      verifyPaymentWithServer(response, amount, user)
    },
  }

  // Initialize Razorpay
  const razorpay = new window.Razorpay(options)

  // Open Razorpay payment modal
  razorpay.open()

  // Handle payment modal close
  razorpay.on("payment.failed", (response) => {
    alert("Payment failed: " + response.error.description)
  })
}

// Verify payment with server
async function verifyPaymentWithServer(response, amount, user) {
  try {
    const verifyResponse = await fetch("/verify-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        user_id: user.id,
        email: user.email,
        amount: amount,
      }),
    })

    const verifyData = await verifyResponse.json()

    if (!verifyData.success) {
      throw new Error(verifyData.error || "Payment verification failed")
    }

    // Payment verified successfully, now save donation to local storage
    handlePaymentSuccess(response, amount, user)
  } catch (error) {
    console.error("Error verifying payment:", error)
    alert("Payment verification failed. Please contact support.")
  }
}

// Handle successful payment
function handlePaymentSuccess(response, amount, user) {
  // Create donation record with payment details
  const donation = {
    id: Date.now().toString(),
    amount: amount,
    date: new Date().toISOString(),
    payment: {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    },
  }

  // Add donation to user's record
  if (!user.donations) {
    user.donations = []
  }
  user.donations.push(donation)

  // Update user in localStorage
  localStorage.setItem("currentUser", JSON.stringify(user))

  // Update in users array
  const users = JSON.parse(localStorage.getItem("users")) || []
  const userIndex = users.findIndex((u) => u.id === user.id)
  if (userIndex !== -1) {
    users[userIndex] = user
    localStorage.setItem("users", JSON.stringify(users))
  }

  // Show success message
  alert(`Thank you for your donation of ₹${amount}!`)

  // Update progress bar and stats after donation
  initProgressBar()
  initStatsCounter()

  // Reset form
  const donationForm = document.querySelector(".donation-form")
  if (donationForm) {
    donationForm.reset()
    const amountButtons = donationForm.querySelectorAll(".amount-btn")
    amountButtons.forEach((btn) => btn.classList.remove("active"))
    const customAmountInput = document.getElementById("custom-amount")
    if (customAmountInput) {
      customAmountInput.style.display = "none"
    }
  }

  // Redirect to dashboard
  window.location.href = "dashboard.html"
}

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('nav');
  
  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', function() {
      nav.classList.toggle('show');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
      if (!nav.contains(event.target) && !mobileMenuToggle.contains(event.target) && nav.classList.contains('show')) {
        nav.classList.remove('show');
      }
    });
    
    // Close menu when clicking a link
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        nav.classList.remove('show');
      });
    });
  }
});

