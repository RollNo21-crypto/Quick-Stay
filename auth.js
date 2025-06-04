// Authentication related functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the authentication forms
    initializeAuthForms();

    // Check if user is already logged in
    checkAuthStatus();
});

/**
 * Initialize authentication forms and form switching
 */
function initializeAuthForms() {
    const loginForm = document.getElementById('login-form-element');
    const registerForm = document.getElementById('register-form-element');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    // Switch between login and register forms
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('register-form').style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            // Basic validation
            if (!email || !password) {
                showAuthMessage('Please fill in all fields', 'error');
                return;
            }

            // Call login API
            loginUser(email, password);
        });
    }

    // Handle registration form submission
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const phone = document.getElementById('register-phone').value;
            const address = document.getElementById('register-address').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;

            // Basic validation
            if (!name || !email || !phone || !password || !confirmPassword) {
                showAuthMessage('Please fill in all required fields', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showAuthMessage('Passwords do not match', 'error');
                return;
            }

            // Call register API
            registerUser(name, email, phone, address, password);
        });
    }
}

/**
 * Login user with provided credentials
 */
async function loginUser(email, password) {
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store user data and token in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);

        // Show success message and redirect
        showAuthMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showAuthMessage(error.message, 'error');
    }
}

/**
 * Register a new user
 */
async function registerUser(name, email, phone, address, password) {
    try {
        // First create the user
        const userResponse = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, phone, address })
        });

        const userData = await userResponse.json();

        if (!userResponse.ok) {
            throw new Error(userData.error || 'User registration failed');
        }

        // Then register auth credentials
        const authResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                userId: userData._id,
                email, 
                password 
            })
        });

        const authData = await authResponse.json();

        if (!authResponse.ok) {
            throw new Error(authData.error || 'Authentication registration failed');
        }

        // Show success message and switch to login form
        showAuthMessage('Registration successful! Please login.', 'success');
        setTimeout(() => {
            document.getElementById('register-form').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
            // Clear the registration form
            document.getElementById('register-form-element').reset();
        }, 1500);

    } catch (error) {
        console.error('Registration error:', error);
        showAuthMessage(error.message, 'error');
    }
}

/**
 * Check if user is already authenticated
 */
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (token && user._id) {
        // User is logged in, redirect to appropriate page
        if (window.location.pathname.includes('auth.html')) {
            window.location.href = 'index.html';
        }
    }
}

/**
 * Display authentication messages to the user
 */
function showAuthMessage(message, type = 'info') {
    // Check if message container exists, if not create it
    let messageContainer = document.querySelector('.auth-message');
    
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.className = 'auth-message';
        const authContainer = document.querySelector('.auth-container');
        if (authContainer) {
            authContainer.prepend(messageContainer);
        }
    }

    // Set message content and style
    messageContainer.textContent = message;
    messageContainer.className = `auth-message ${type}`;
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
        messageContainer.style.opacity = '0';
        setTimeout(() => {
            messageContainer.remove();
        }, 500);
    }, 5000);
}

/**
 * Logout the current user
 */
function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Export functions for use in other scripts
window.authFunctions = {
    logoutUser,
    checkAuthStatus
};