// Form validation and submission handling
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('contactForm');
    const formMessage = document.getElementById('formMessage');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Clear previous messages
        formMessage.className = 'form-message';
        formMessage.textContent = '';

        // Validate WhatsApp number format
        const whatsappInput = document.getElementById('whatsapp');
        const whatsappValue = whatsappInput.value.trim();

        if (!whatsappValue.startsWith('+')) {
            showMessage('Please include the country code in your WhatsApp number (e.g., +1, +44, +213)', 'error');
            whatsappInput.focus();
            return;
        }

        // Show loading state
        const submitBtn = form.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="btn-text">Sending...</span>';
        submitBtn.disabled = true;

        // Create FormData object
        const formData = new FormData(form);

        // Convert FormData to JSON for serverless function
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });

        // Submit form via AJAX to Vercel serverless function
        fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonData)
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showMessage(data.message, 'success');
                    form.reset();
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(error => {
                showMessage('An error occurred. Please try again or contact us directly.', 'error');
                console.error('Error:', error);
            })
            .finally(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
    });

    function showMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = 'form-message ' + type;
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Add input animations
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.style.transform = 'translateY(-2px)';
        });

        input.addEventListener('blur', function () {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
});
