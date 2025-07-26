# Nourish Hope: Hunger Relief Crowdfunding Platform

**Nourish Hope** is a full-stack web application designed to facilitate crowdfunding for hunger relief initiatives. It provides a secure and user-friendly platform for donors to contribute to the cause, track the campaign's progress, and manage their donation history through a personal dashboard.

The application features a secure, passwordless authentication system using email OTPs and integrates with Razorpay for reliable payment processing.

### Key Features

* **Secure User Authentication:** Passwordless login and registration system using one-time passwords (OTPs) sent via email.
* **Donation Processing:** Seamless and secure payment integration with the Razorpay API to handle donations.
* **User Dashboard:** A personal dashboard for registered users to view their total contributions, see the impact of their donations (e.g., meals provided), and track their complete donation history.
* **Dynamic Progress Tracking:** The homepage features a live progress bar and animated statistics (meals served, communities reached) that update based on total donations collected.
* **Responsive Design:** A mobile-first design that ensures a seamless user experience across all devices, from desktops to mobile phones.
* **Node.js Backend:** A robust backend built with Express.js to handle API requests, user authentication, and payment verification.

### Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript
* **Backend:** Node.js, Express.js
* **Payments:** Razorpay API
* **Authentication:** Nodemailer for OTP email delivery
* **Deployment:** Configured for deployment on platforms like Vercel or Render.

### Getting Started

To get a local copy up and running, follow these simple steps.

**Prerequisites**

* Node.js and npm installed on your machine.
* A `.env` file with your environment variables.

**Installation**

1.  Clone the repo:
    ```sh
    git clone [https://github.com/your-username/nourish-hope.git](https://github.com/your-username/nourish-hope.git)
    ```
2.  Navigate to the project directory:
    ```sh
    cd nourish-hope
    ```
3.  Install NPM packages:
    ```sh
    npm install
    ```
4.  Create a `.env` file in the root directory and add your environment variables:
    ```env
    EMAIL=your-email@gmail.com
    EMAIL_PASS=your-email-password
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_KEY_SECRET=your_razorpay_key_secret
    ```
5.  Start the server:
    ```sh
    npm start
    ```
6.  Open your browser and navigate to `http://localhost:5000`.
