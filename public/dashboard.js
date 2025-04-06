// dashboard.js - Handles dashboard functionality

// Initialize dashboard
function initDashboard() {
  // Check if on dashboard page
  if (!window.location.pathname.includes("dashboard.html")) {
    return
  }

  // Get current user
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) {
    window.location.href = "login.html"
    return
  }

  // Populate user info
  document.getElementById("user-name").textContent = currentUser.name
  document.getElementById("user-email").textContent = currentUser.email

  // Tab switching
  const tabLinks = document.querySelectorAll(".dashboard-nav a")
  tabLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()

      // Remove active class from all tabs
      tabLinks.forEach((l) => l.classList.remove("active"))
      document.querySelectorAll(".dashboard-tab").forEach((tab) => tab.classList.remove("active"))

      // Add active class to clicked tab
      link.classList.add("active")
      document.getElementById(link.dataset.tab).classList.add("active")
    })
  })

  // Load dashboard data
  loadDashboardData()

  // Initialize profile form
  initProfileForm()
}

// Load dashboard data
function loadDashboardData() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) return

  // Calculate donation stats
  const donations = currentUser.donations || []
  const totalDonations = donations.length
  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)
  const mealsProvided = Math.floor(totalAmount / 50) // Assuming ₹50 provides one meal

  // Update stats
  document.getElementById("total-donations").textContent = totalDonations
  document.getElementById("total-amount").textContent = `₹${totalAmount.toLocaleString()}`
  document.getElementById("meals-provided").textContent = mealsProvided.toLocaleString()

  // Load recent activities
  loadRecentActivities()

  // Load donations list
  loadDonationsList()
}

// Load recent activities
function loadRecentActivities() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) return

  const activitiesList = document.getElementById("recent-activities")
  activitiesList.innerHTML = ""

  const donations = currentUser.donations || []

  // Sort donations by date (newest first)
  donations.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Take only the 5 most recent donations
  const recentDonations = donations.slice(0, 5)

  if (recentDonations.length === 0) {
    activitiesList.innerHTML = '<p class="empty-state">No recent activity to display.</p>'
    return
  }

  // Create activity items
  recentDonations.forEach((donation) => {
    const activityItem = document.createElement("div")
    activityItem.className = "activity-item"

    const date = new Date(donation.date)
    const formattedDate = date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    activityItem.innerHTML = `
            <div class="activity-date">${formattedDate}</div>
            <div class="activity-description">You donated ₹${donation.amount.toLocaleString()}</div>
        `

    activitiesList.appendChild(activityItem)
  })
}

// Load donations list
function loadDonationsList() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) return

  const donationsList = document.getElementById("donations-list")
  donationsList.innerHTML = ""

  const donations = currentUser.donations || []

  if (donations.length === 0) {
    donationsList.innerHTML =
      '<p class="empty-state">No donations yet. <a href="index.html#donate">Make your first donation!</a></p>'
    return
  }

  // Sort donations by date (newest first)
  donations.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Create donation items
  donations.forEach((donation) => {
    const donationItem = document.createElement("div")
    donationItem.className = "donation-item"

    const date = new Date(donation.date)
    const formattedDate = date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })

    donationItem.innerHTML = `
            <div class="donation-info">
                <h4>Donation</h4>
                <div class="donation-date">${formattedDate}</div>
            </div>
            <div class="donation-amount">₹${donation.amount.toLocaleString()}</div>
        `

    donationsList.appendChild(donationItem)
  })
}

// Initialize profile form
function initProfileForm() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) return

  // Populate form fields
  document.getElementById("profile-name").value = currentUser.name || ""
  document.getElementById("profile-email").value = currentUser.email || ""
  document.getElementById("profile-phone").value = currentUser.phone || ""
  document.getElementById("profile-address").value = currentUser.address || ""

  // Handle form submission
  const profileForm = document.getElementById("profile-form")
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Get form values
    const name = document.getElementById("profile-name").value
    const phone = document.getElementById("profile-phone").value
    const address = document.getElementById("profile-address").value

    // Update user data
    currentUser.name = name
    currentUser.phone = phone
    currentUser.address = address

    // Update in localStorage
    localStorage.setItem("currentUser", JSON.stringify(currentUser))

    // Update in users array
    const users = JSON.parse(localStorage.getItem("users")) || []
    const userIndex = users.findIndex((u) => u.id === currentUser.id)
    if (userIndex !== -1) {
      users[userIndex] = currentUser
      localStorage.setItem("users", JSON.stringify(users))
    }

    // Show success message
    alert("Profile updated successfully!")

    // Update displayed name
    document.getElementById("user-name").textContent = name
  })
}

// Run on page load
document.addEventListener("DOMContentLoaded", initDashboard)

