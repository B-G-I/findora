<?php
/**
 * Contact Form Submission Handler
 * Sends form data to your email using Gmail SMTP
 */

// Set JSON response header
header('Content-Type: application/json');

// Include configuration
require_once 'config.php';

// Function to send email using Gmail SMTP
function sendEmail($data) {
    // Validate configuration
    if (RECIPIENT_EMAIL === 'your-email@gmail.com' || GMAIL_APP_PASSWORD === 'your-app-password-here') {
        return [
            'success' => false,
            'message' => 'Email configuration is not set up. Please configure config.php file.'
        ];
    }
    
    // Sanitize input data
    $name = htmlspecialchars(trim($data['name']));
    $email = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    $subject = htmlspecialchars(trim($data['subject']));
    $description = htmlspecialchars(trim($data['description']));
    $country = htmlspecialchars(trim($data['country']));
    $whatsapp = htmlspecialchars(trim($data['whatsapp']));
    
    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return [
            'success' => false,
            'message' => 'Invalid email address provided.'
        ];
    }
    
    // Create email subject
    $emailSubject = "New Project Request: " . $subject;
    
    // Create email body
    $emailBody = "
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
                    <div class='field-value'>{$name}</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>📧 Email Address:</div>
                    <div class='field-value'>{$email}</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>📱 WhatsApp Number:</div>
                    <div class='field-value'>{$whatsapp}</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>🌍 Country:</div>
                    <div class='field-value'>{$country}</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>📋 Project Title:</div>
                    <div class='field-value'>{$subject}</div>
                </div>
                
                <div class='field'>
                    <div class='field-label'>📝 Project Description:</div>
                    <div class='field-value'>" . nl2br($description) . "</div>
                </div>
                
                <div class='footer'>
                    <p>This message was sent from the contact form at " . WEBSITE_URL . "</p>
                    <p>Submitted on: " . date('F j, Y, g:i a') . "</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    ";
    
    // Email headers
    $headers = [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: ' . SENDER_NAME . ' <' . SENDER_EMAIL . '>',
        'Reply-To: ' . $name . ' <' . $email . '>',
        'X-Mailer: PHP/' . phpversion()
    ];
    
    // Try to send email using PHP mail() function
    // Note: This requires your server to have mail() configured
    $mailSent = mail(RECIPIENT_EMAIL, $emailSubject, $emailBody, implode("\r\n", $headers));
    
    if ($mailSent) {
        return [
            'success' => true,
            'message' => 'Thank you! Your project request has been submitted successfully. We\'ll get back to you within 24 hours.'
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Sorry, there was an error sending your message. Please try again or contact us directly via email.'
        ];
    }
}

// Handle POST request
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if all required fields are present
    $requiredFields = ['name', 'email', 'subject', 'description', 'country', 'whatsapp'];
    $missingFields = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
            $missingFields[] = $field;
        }
    }
    
    if (!empty($missingFields)) {
        echo json_encode([
            'success' => false,
            'message' => 'Please fill in all required fields: ' . implode(', ', $missingFields)
        ]);
        exit;
    }
    
    // Send email
    $result = sendEmail($_POST);
    echo json_encode($result);
    
} else {
    // Not a POST request
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method.'
    ]);
}
