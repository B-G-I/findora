const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: 'Method not allowed. Please use POST.'
        });
    }

    try {
        // Get form data
        const { name, email, subject, description, country, whatsapp } = req.body;

        // Validate required fields
        const requiredFields = { name, email, subject, description, country, whatsapp };
        const missingFields = Object.entries(requiredFields)
            .filter(([key, value]) => !value || value.trim() === '')
            .map(([key]) => key);

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Please fill in all required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address provided.'
            });
        }

        // Validate WhatsApp number starts with +
        if (!whatsapp.trim().startsWith('+')) {
            return res.status(400).json({
                success: false,
                message: 'WhatsApp number must include country code (e.g., +1, +44, +213)'
            });
        }

        // Create transporter using Gmail SMTP
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // Create email HTML
        const emailHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #5FE3D9 0%, #B565D8 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }
                .field { margin-bottom: 15px; }
                .field-label { font-weight: bold; color: #4A4A4A; }
                .field-value { margin-top: 5px; padding: 10px; background: white; border-radius: 5px; }
                .footer { margin-top: 20px; padding-top: 20px; border-top: 2px solid #e9ecef; font-size: 12px; color: #6c757d; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>🎯 New Project Request from FindAura.org</h2>
                </div>
                <div class='content'>
                    <div class='field'>
                        <div class='field-label'>👤 Client Name:</div>
                        <div class='field-value'>${name}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='field-label'>📧 Email Address:</div>
                        <div class='field-value'>${email}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='field-label'>📱 WhatsApp Number:</div>
                        <div class='field-value'>${whatsapp}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='field-label'>🌍 Country:</div>
                        <div class='field-value'>${country}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='field-label'>📋 Project Title:</div>
                        <div class='field-value'>${subject}</div>
                    </div>
                    
                    <div class='field'>
                        <div class='field-label'>📝 Project Description:</div>
                        <div class='field-value'>${description.replace(/\n/g, '<br>')}</div>
                    </div>
                    
                    <div class='footer'>
                        <p>This message was sent from the contact form at https://findaura.org</p>
                        <p>Submitted on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        // Email options
        const mailOptions = {
            from: `Find Aura Website <${process.env.GMAIL_USER}>`,
            to: process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER,
            replyTo: `${name} <${email}>`,
            subject: `New Project Request: ${subject}`,
            html: emailHTML
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Return success response
        return res.status(200).json({
            success: true,
            message: "Thank you! Your project request has been submitted successfully. We'll get back to you within 24 hours."
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({
            success: false,
            message: 'Sorry, there was an error sending your message. Please try again or contact us directly via email.',
            error: error.message
        });
    }
};
