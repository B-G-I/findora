<?php
header('Content-Type: application/json');
require_once 'config.php';

// Show PHP errors while testing (disable in production)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

/**
 * Send raw SMTP over SSL to Gmail (port 465) using AUTH LOGIN
 * Returns array ['success'=>bool, 'message'=>string, 'debug'=>string(optional)]
 */
function smtpSend($fromEmail, $fromName, $toEmail, $subject, $htmlBody) {
    $host = GMAIL_SMTP_HOST; // 'ssl://smtp.gmail.com'
    $port = GMAIL_SMTP_PORT; // 465
    $username = GMAIL_SMTP_USERNAME;
    $password = GMAIL_APP_PASSWORD;
    $timeout = 30;

    $debugOutput = '';

    // Open SSL socket
    $fp = stream_socket_client("{$host}:{$port}", $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT);
    if (!$fp) {
        return ['success' => false, 'message' => "Could not connect to SMTP server: $errstr ($errno)"];
    }

    // helper to read response
    $readResponse = function() use ($fp, &$debugOutput) {
        $res = '';
        while ($str = fgets($fp, 515)) {
            $res .= $str;
            // SMTP responses that start with code + space are final for that command (e.g. "250 OK")
            if (isset($str[3]) && $str[3] === ' ') break;
        }
        $debugOutput .= $res;
        return $res;
    };

    // helper to send command
    $sendCmd = function($cmd) use ($fp, &$debugOutput) {
        fwrite($fp, $cmd . "\r\n");
        $debugOutput .= "C: $cmd\r\n";
    };

    // Read server greeting
    $greeting = $readResponse();
    if (substr($greeting, 0, 3) !== '220') {
        fclose($fp);
        return ['success' => false, 'message' => 'Unexpected SMTP greeting', 'debug' => $debugOutput];
    }

    // EHLO
    $sendCmd("EHLO " . gethostname());
    $ehlo = $readResponse();
    if (substr($ehlo, 0, 3) !== '250') {
        // some servers accept HELO
        $sendCmd("HELO " . gethostname());
        $helo = $readResponse();
        if (substr($helo, 0, 3) !== '250') {
            fclose($fp);
            return ['success' => false, 'message' => 'EHLO/HELO not accepted', 'debug' => $debugOutput];
        }
    }

    // AUTH LOGIN sequence (username & password base64)
    $sendCmd("AUTH LOGIN");
    $resp = $readResponse();
    if (substr($resp, 0, 3) !== '334') {
        fclose($fp);
        return ['success' => false, 'message' => 'SMTP server refused AUTH LOGIN', 'debug' => $debugOutput];
    }

    $sendCmd(base64_encode($username));
    $resp = $readResponse();
    if (substr($resp, 0, 3) !== '334') {
        fclose($fp);
        return ['success' => false, 'message' => 'SMTP server did not ask for password', 'debug' => $debugOutput];
    }

    $sendCmd(base64_encode($password));
    $resp = $readResponse();
    if (substr($resp, 0, 3) !== '235') {
        fclose($fp);
        return ['success' => false, 'message' => 'Authentication failed (check username/app password)', 'debug' => $debugOutput];
    }

    // MAIL FROM
    $sendCmd("MAIL FROM:<{$fromEmail}>");
    $resp = $readResponse();
    if (substr($resp, 0, 3) !== '250') {
        fclose($fp);
        return ['success' => false, 'message' => 'MAIL FROM rejected', 'debug' => $debugOutput];
    }

    // RCPT TO
    $sendCmd("RCPT TO:<{$toEmail}>");
    $resp = $readResponse();
    if (substr($resp, 0, 3) !== '250' && substr($resp, 0, 3) !== '251') {
        fclose($fp);
        return ['success' => false, 'message' => 'RCPT TO rejected', 'debug' => $debugOutput];
    }

    // DATA
    $sendCmd("DATA");
    $resp = $readResponse();
    if (substr($resp, 0, 3) !== '354') {
        fclose($fp);
        return ['success' => false, 'message' => 'DATA command not accepted', 'debug' => $debugOutput];
    }

    // Create headers
    $boundary = md5(time());
    $headers = [];
    $headers[] = "From: {$fromName} <{$fromEmail}>";
    $headers[] = "Reply-To: {$fromName} <{$fromEmail}>";
    $headers[] = "MIME-Version: 1.0";
    $headers[] = "Content-Type: text/html; charset=UTF-8";
    $headers[] = "Content-Transfer-Encoding: 7bit";
    $headers[] = "Subject: " . $subject;

    // Full message
    $message = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.\r\n";

    // send message data
    fwrite($fp, $message);
    $debugOutput .= "C: (message body)\r\n";
    $resp = $readResponse();
    if (substr($resp, 0, 3) !== '250') {
        fclose($fp);
        return ['success' => false, 'message' => 'Message not accepted by server', 'debug' => $debugOutput];
    }

    // QUIT
    $sendCmd("QUIT");
    $quitResp = $readResponse();

    fclose($fp);
    return ['success' => true, 'message' => 'Message sent via SMTP', 'debug' => $debugOutput];
}

// ---------- Handler logic ----------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// required fields
$required = ['name','email','subject','description','country','whatsapp'];
$missing = [];
foreach ($required as $f) {
    if (!isset($_POST[$f]) || trim($_POST[$f]) === '') $missing[] = $f;
}
if (!empty($missing)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields: ' . implode(', ', $missing)]);
    exit;
}

// sanitize
$name = htmlspecialchars(trim($_POST['name']));
$email = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
$subject = htmlspecialchars(trim($_POST['subject']));
$description = htmlspecialchars(trim($_POST['description']));
$country = htmlspecialchars(trim($_POST['country']));
$whatsapp = htmlspecialchars(trim($_POST['whatsapp']));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success'=>false,'message'=>'Invalid email address provided.']);
    exit;
}

// build HTML body
$htmlBody = "<html><body>";
$htmlBody .= "<h2>🎯 New Project Request from " . WEBSITE_URL . "</h2>";
$htmlBody .= "<p><strong>Client Name:</strong> {$name}</p>";
$htmlBody .= "<p><strong>Email:</strong> {$email}</p>";
$htmlBody .= "<p><strong>WhatsApp:</strong> {$whatsapp}</p>";
$htmlBody .= "<p><strong>Country:</strong> {$country}</p>";
$htmlBody .= "<p><strong>Project Title:</strong> {$subject}</p>";
$htmlBody .= "<p><strong>Description:</strong><br/>" . nl2br($description) . "</p>";
$htmlBody .= "<hr/><p>Submitted on: " . date('F j, Y, g:i a') . "</p>";
$htmlBody .= "</body></html>";

// try SMTP send
$result = smtpSend(SENDER_EMAIL, SENDER_NAME, RECIPIENT_EMAIL, "New Project Request: " . $subject, $htmlBody);

if ($result['success']) {
    echo json_encode(['success'=>true,'message'=>"Thank you! Your project request has been submitted successfully."]);
} else {
    // if DEBUG on, include debug info
    $response = ['success'=>false,'message'=>'Sorry, there was an error sending your message.'];
    if (defined('DEBUG') && DEBUG && isset($result['debug'])) $response['debug'] = $result['debug'];
    if (isset($result['message'])) $response['smtp_msg'] = $result['message'];
    echo json_encode($response);
}