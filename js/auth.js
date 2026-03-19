// Authentication Logic

// Initialize date of birth fields for register page
function initDOBFields() {
    const daySelect = document.getElementById('dobDay');
    const yearSelect = document.getElementById('dobYear');
    
    if (daySelect) {
        for (let i = 1; i <= 31; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            daySelect.appendChild(option);
        }
    }
    
    if (yearSelect) {
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= currentYear - 100; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearSelect.appendChild(option);
        }
    }
}

// Mock user database (localStorage)
function getUsers() {
    const users = localStorage.getItem('discord_clone_users');
    return users ? JSON.parse(users) : [];
}

function saveUser(user) {
    const users = getUsers();
    users.push(user);
    localStorage.setItem('discord_clone_users', JSON.stringify(users));
}

function findUser(email) {
    const users = getUsers();
    return users.find(u => u.email === email);
}

// Login Form Handler
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    // Check user
    const user = findUser(email);
    if (!user) {
        showError('Invalid email or password');
        return;
    }
    
    if (user.password !== password) {
        showError('Invalid email or password');
        return;
    }
    
    // Login successful
    localStorage.setItem('discord_clone_current_user', JSON.stringify({
        username: user.username,
        email: user.email,
        avatar: user.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'
    }));
    
    // Redirect to main app
    window.location.href = 'index.html';
}

// Register Form Handler
function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const dobMonth = document.getElementById('dobMonth').value;
    const dobDay = document.getElementById('dobDay').value;
    const dobYear = document.getElementById('dobYear').value;
    
    // Validation
    if (!email || !username || !password || !dobMonth || !dobDay || !dobYear) {
        showError('Please fill in all required fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Username validation
    if (username.length < 2 || username.length > 32) {
        showError('Username must be between 2 and 32 characters');
        return;
    }
    
    // Password validation
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    // Check if user already exists
    if (findUser(email)) {
        showError('An account with this email already exists');
        return;
    }
    
    // Create user
    const newUser = {
        email,
        username,
        password, // In a real app, this should be hashed!
        avatar: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`,
        createdAt: new Date().toISOString()
    };
    
    saveUser(newUser);
    
    // Auto login
    localStorage.setItem('discord_clone_current_user', JSON.stringify({
        username: newUser.username,
        email: newUser.email,
        avatar: newUser.avatar
    }));
    
    // Redirect to main app
    window.location.href = 'index.html';
}

// Show error message
function showError(message) {
    // Remove existing error
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        background: #ed4245;
        color: white;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
        font-size: 14px;
        text-align: center;
    `;
    
    // Insert at top of form
    const form = document.querySelector('.auth-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Check if user is logged in
function checkAuth() {
    const currentUser = localStorage.getItem('discord_clone_current_user');
    
    // If on main page and not logged in, redirect to login
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        if (!currentUser) {
            window.location.href = 'login.html';
            return null;
        }
        return JSON.parse(currentUser);
    }
    
    // If on auth page and logged in, redirect to main
    if ((window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) && currentUser) {
        window.location.href = 'index.html';
        return null;
    }
    
    return currentUser ? JSON.parse(currentUser) : null;
}

// Logout function
function logout() {
    localStorage.removeItem('discord_clone_current_user');
    window.location.href = 'login.html';
}

// Initialize
function init() {
    initDOBFields();
    
    // Setup form handlers
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', init);
