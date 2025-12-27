/**
 * Authentication JavaScript
 * Handles login and registration
 */

document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initRegisterForm();
    initPasswordToggles();
});

// Initialize login form
function initLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember')?.checked || false;

        const loginBtn = document.getElementById('loginBtn');
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');

        // Show loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        errorAlert.style.display = 'none';

        try {
            // Simulate API call
            await simulateLogin(email, password);

            // Mock user data
            const user = {
                id: '1',
                username: email.split('@')[0],
                email: email
            };

            const token = 'mock_jwt_token_' + Date.now();

            // Save to AppState
            window.AppState.saveUser(user, token);

            // Show success
            window.showNotification('Connexion réussie !', 'success');

            // Redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            errorMessage.textContent = error.message;
            errorAlert.style.display = 'flex';
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });
}

// Initialize register form
function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    // Password strength indicator
    if (passwordInput) {
        passwordInput.addEventListener('input', (e) => {
            updatePasswordStrength(e.target.value);
        });
    }

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const terms = document.getElementById('terms').checked;

        const registerBtn = document.getElementById('registerBtn');
        const errorAlert = document.getElementById('errorAlert');
        const errorMessage = document.getElementById('errorMessage');

        // Validation
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Les mots de passe ne correspondent pas';
            errorAlert.style.display = 'flex';
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
            errorAlert.style.display = 'flex';
            return;
        }

        if (!terms) {
            errorMessage.textContent = 'Vous devez accepter les conditions d\'utilisation';
            errorAlert.style.display = 'flex';
            return;
        }

        // Show loading state
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        errorAlert.style.display = 'none';

        try {
            // Simulate API call
            await simulateRegister(username, email, password);

            // Mock user data
            const user = {
                id: '1',
                username: username,
                email: email
            };

            const token = 'mock_jwt_token_' + Date.now();

            // Save to AppState
            window.AppState.saveUser(user, token);

            // Show success
            window.showNotification('Compte créé avec succès !', 'success');

            // Redirect
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);

        } catch (error) {
            errorMessage.textContent = error.message;
            errorAlert.style.display = 'flex';
            registerBtn.classList.remove('loading');
            registerBtn.disabled = false;
        }
    });
}

// Initialize password toggles
function initPasswordToggles() {
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');

    if (togglePassword) {
        const passwordInput = document.getElementById('password');
        togglePassword.addEventListener('click', () => {
            togglePasswordVisibility(passwordInput, togglePassword);
        });
    }

    if (toggleConfirmPassword) {
        const confirmPasswordInput = document.getElementById('confirmPassword');
        toggleConfirmPassword.addEventListener('click', () => {
            togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
        });
    }
}

function togglePasswordVisibility(input, button) {
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Update password strength
function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar-fill');
    const strengthText = document.querySelector('.strength-text');

    if (!strengthBar || !strengthText) return;

    let strength = 0;

    // Length
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;

    // Contains number
    if (/\d/.test(password)) strength++;

    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;

    // Contains special char
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    // Update display
    strengthBar.className = 'strength-bar-fill';

    if (strength <= 2) {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Faible';
        strengthText.style.color = '#ef4444';
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
        strengthText.textContent = 'Moyen';
        strengthText.style.color = '#f59e0b';
    } else {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Fort';
        strengthText.style.color = '#10b981';
    }
}
