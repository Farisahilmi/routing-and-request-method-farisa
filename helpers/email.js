const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

// Verify connection (only if credentials are provided)
if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'your-email@gmail.com') {
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email server connection failed:', error.message);
    } else {
      console.log('✅ Email server is ready to send messages');
    }
  });
} else {
  console.log('⚠️  Email configuration not set - emails will be logged instead of sent');
}

// Email templates
const emailTemplates = {
  orderConfirmation: (orderData) => ({
    subject: `Order Confirmation - Order #${orderData.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #635BFF;">Order Confirmation</h2>
        <p>Dear ${orderData.customerName},</p>
        <p>Thank you for your order! Here are the details:</p>

        <div style="background: #f6f9fc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order #${orderData.id}</h3>
          <p><strong>Date:</strong> ${orderData.date}</p>
          <p><strong>Total:</strong> ${orderData.total}</p>
          <p><strong>Status:</strong> ${orderData.status}</p>
        </div>

        <h4>Items Ordered:</h4>
        <ul>
          ${orderData.items.map(item => `<li>${item.name} (x${item.quantity}) - ${item.price}</li>`).join('')}
        </ul>

        <p>Shipping Address: ${orderData.shippingAddress}</p>

        <p>You will receive another email when your order ships.</p>

        <p>Best regards,<br>Simple Store Team</p>
      </div>
    `
  }),

  passwordReset: (resetData) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #635BFF;">Password Reset</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your Simple Store account.</p>
        <p>Click the link below to reset your password:</p>

        <a href="${resetData.resetLink}" style="background: #635BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>

        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>

        <p>Best regards,<br>Simple Store Team</p>
      </div>
    `
  }),

  welcome: (userData) => ({
    subject: 'Welcome to Simple Store!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #635BFF;">Welcome to Simple Store!</h2>
        <p>Hello ${userData.username},</p>
        <p>Thank you for registering with Simple Store!</p>
        <p>You can now:</p>
        <ul>
          <li>Browse our products</li>
          <li>Add items to your cart</li>
          <li>Write reviews</li>
          <li>Track your orders</li>
        </ul>

        <a href="${process.env.BASE_URL || 'http://localhost:3000'}" style="background: #635BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
          Start Shopping
        </a>

        <p>Best regards,<br>Simple Store Team</p>
      </div>
    `
  }),

  contactForm: (contactData) => ({
    subject: `New Contact Form Message from ${contactData.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #635BFF;">New Contact Form Message</h2>
        <div style="background: #f6f9fc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${contactData.name}</p>
          <p><strong>Email:</strong> ${contactData.email}</p>
          <p><strong>Subject:</strong> ${contactData.subject || 'No subject'}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap;">${contactData.message}</p>
        </div>
      </div>
    `
  })
};

// Send email function
async function sendEmail(to, template, data) {
  try {
    const templateData = emailTemplates[template](data);

    const mailOptions = {
      from: `"Simple Store" <${process.env.EMAIL_USER || 'noreply@simplestore.com'}>`,
      to: to,
      subject: templateData.subject,
      html: templateData.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

// Specific email functions
async function sendOrderConfirmation(orderData) {
  return await sendEmail(orderData.customerEmail, 'orderConfirmation', orderData);
}

async function sendPasswordReset(resetData) {
  return await sendEmail(resetData.email, 'passwordReset', resetData);
}

async function sendWelcomeEmail(userData) {
  return await sendEmail(userData.email, 'welcome', userData);
}

async function sendContactNotification(contactData) {
  // Send to admin
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@simplestore.com';
  return await sendEmail(adminEmail, 'contactForm', contactData);
}

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPasswordReset,
  sendWelcomeEmail,
  sendContactNotification
};
