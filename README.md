# FindAura.org - Contact Website

A modern, professional single-page website for FindAura with a contact form for project submissions.

## 🎨 Features

- **Modern Design**: Clean, professional design with brand colors (cyan, purple, magenta)
- **Responsive**: Fully responsive design for mobile and desktop
- **Contact Form**: Complete form with all required fields:
  - Client name
  - Email address
  - Project title/subject
  - Project description
  - Country
  - WhatsApp number (with country code)
- **Email Integration**: Sends form submissions directly to your email
- **Form Validation**: Client-side and server-side validation
- **Smooth Animations**: Professional animations and transitions

## 📁 File Structure

```
findaura/
├── index.html          # Main HTML file
├── styles.css          # All styling and responsive design
├── script.js           # Form validation and AJAX submission
├── submit.php          # PHP email handler
├── config.php          # Email configuration (MUST BE CONFIGURED)
├── assets/
│   ├── business-card-1.png
│   └── business-card-2.png
└── README.md           # This file
```

## ⚙️ Setup Instructions

### 1. Configure Email Settings

Open `config.php` and update the following:

```php
define('RECIPIENT_EMAIL', 'your-actual-email@gmail.com');
define('SENDER_EMAIL', 'your-actual-email@gmail.com');
define('GMAIL_APP_PASSWORD', 'your-16-char-app-password');
```

### 2. Generate Gmail App Password

**Important**: You need a Gmail App Password, NOT your regular Gmail password.

Steps to generate:
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to https://myaccount.google.com/apppasswords
4. Select **"Mail"** and **"Other (Custom name)"**
5. Name it **"FindAura Website"**
6. Click **Generate**
7. Copy the **16-character password** (format: xxxx xxxx xxxx xxxx)
8. Paste it in `config.php` (remove spaces)

### 3. Server Requirements

Your hosting server must have:
- PHP 7.0 or higher
- PHP `mail()` function enabled (most shared hosting has this)
- Write permissions for the web directory

### 4. Upload to Server

Upload all files to your web server:
```bash
# Using FTP/SFTP, upload all files to your public_html or www directory
# OR using Git:
git init
git add .
git commit -m "Initial commit - FindAura website"
git remote add origin <your-repo-url>
git push -u origin main
```

### 5. Test the Form

1. Visit your website: https://findaura.org
2. Fill out the contact form
3. Submit and check your email

## 🔧 Troubleshooting

### Email Not Sending?

1. **Check config.php**: Ensure all credentials are correct
2. **Check spam folder**: First emails might go to spam
3. **Server mail() function**: Contact your hosting provider to ensure `mail()` is enabled
4. **Alternative**: If `mail()` doesn't work, you can use PHPMailer or a service like SendGrid

### Alternative Email Solution (PHPMailer)

If the basic `mail()` function doesn't work on your server, you can use PHPMailer with SMTP:

```bash
composer require phpmailer/phpmailer
```

Let me know if you need help implementing PHPMailer.

## 🚀 Deployment Checklist

- [ ] Update `config.php` with your Gmail credentials
- [ ] Generate Gmail App Password
- [ ] Upload all files to server
- [ ] Test form submission
- [ ] Check email delivery
- [ ] Test on mobile devices
- [ ] Verify responsive design

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎨 Customization

### Colors
Edit CSS variables in `styles.css`:
```css
:root {
    --cyan: #5FE3D9;
    --purple: #B565D8;
    --magenta: #D946A6;
}
```

### Content
Edit text directly in `index.html`

## 📄 License

© 2025 Find Aura. All rights reserved.

## 🆘 Support

If you encounter any issues, please contact your web developer or hosting provider.

---

**Built with ❤️ for Find Aura**
