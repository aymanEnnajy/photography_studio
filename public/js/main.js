/**
 * PhotoStudio Hub - Main JavaScript
 * Handles global interactions, animations, and utilities
 */

// ========================================
// API Helper
// ========================================
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8787/api'
    : 'https://photography-studio-backend.aymanennajy.workers.dev/api'; // Replace with your actual worker subdomain if different

const API = {
    async request(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Une erreur est survenue');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error; // Re-throw to be handled by caller
        }
    },

    get(endpoint) { return this.request(endpoint, 'GET'); },
    post(endpoint, body) { return this.request(endpoint, 'POST', body); },
    put(endpoint, body) { return this.request(endpoint, 'PUT', body); },
    delete(endpoint) { return this.request(endpoint, 'DELETE'); }
};

window.API = API;

// ========================================
// Global State Management
// ========================================
const AppState = {
    user: null,
    favorites: [],
    isAuthenticated: false,

    async init() {
        this.loadFromStorage();
        if (this.isAuthenticated) {
            // Validate token / refresh user data
            try {
                const user = await API.get('/auth/me');
                this.user = user;
                this.saveUser(user, localStorage.getItem('token')); // Update stored user
            } catch (e) {
                // Token invalid
                this.logout();
            }
        }
        this.updateUI();
    },

    loadFromStorage() {
        const userData = localStorage.getItem('user');
        const favoritesData = localStorage.getItem('favorites');
        const token = localStorage.getItem('token');

        if (userData && token) {
            this.user = JSON.parse(userData);
            this.isAuthenticated = true;
        }

        if (favoritesData) {
            this.favorites = JSON.parse(favoritesData);
        }
    },

    saveUser(user, token) {
        this.user = user;
        this.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        this.updateUI();
    },

    logout() {
        this.user = null;
        this.isAuthenticated = false;
        this.favorites = [];
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('favorites');
        this.updateUI();
        window.location.href = 'index.html';
    },

    addFavorite(studioId) {
        if (!this.favorites.includes(studioId)) {
            this.favorites.push(studioId);
            localStorage.setItem('favorites', JSON.stringify(this.favorites));
        }
    },

    removeFavorite(studioId) {
        this.favorites = this.favorites.filter(id => id !== studioId);
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
    },

    isFavorite(studioId) {
        return this.favorites.includes(studioId);
    },

    updateUI() {
        const navAuth = document.getElementById('navAuth');
        const navProfile = document.getElementById('navProfile');
        const usernameDisplay = document.getElementById('usernameDisplay');

        if (this.isAuthenticated && this.user) {
            if (navAuth) navAuth.style.display = 'none';
            if (navProfile) {
                navProfile.style.display = 'block';
                if (usernameDisplay) {
                    usernameDisplay.textContent = this.user.username || 'Utilisateur';
                }
            }
        } else {
            if (navAuth) navAuth.style.display = 'flex';
            if (navProfile) navProfile.style.display = 'none';
        }
    }
};

// ========================================
// DOM Content Loaded
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app state
    AppState.init();

    // Initialize all components
    initNavigation();
    initScrollEffects();
    initAnimations();
    initFavorites();
    initLogout();
    hideLoadingScreen();
});

// ========================================
// Loading Screen
// ========================================
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 1000);
    }
}

// ========================================
// Navigation
// ========================================
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const profileBtn = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    // Mobile menu toggle
    if (mobileToggle && navMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Profile dropdown
    if (profileBtn && profileDropdown) {
        profileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            profileDropdown.classList.remove('active');
        });
    }

    // Navbar scroll effect
    if (navbar) {
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });
    }
}

// ========================================
// Scroll Effects
// ========================================
function initScrollEffects() {
    // Scroll to top button
    const scrollTopBtn = document.getElementById('scrollTop');

    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });

        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// Animations (Simple AOS alternative)
// ========================================
function initAnimations() {
    const animatedElements = document.querySelectorAll('[data-aos]');

    if (animatedElements.length === 0) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// ========================================
// Favorites System
// ========================================
function initFavorites() {
    const favoriteBtns = document.querySelectorAll('.favorite-btn, .favorite-btn-large');

    favoriteBtns.forEach(btn => {
        const studioId = btn.dataset.studioId;

        // Set initial state
        if (studioId && AppState.isFavorite(studioId)) {
            btn.classList.add('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        }

        // Add click handler
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(btn, studioId);
        });
    });
}

function toggleFavorite(btn, studioId) {
    if (!AppState.isAuthenticated) {
        showNotification('Veuillez vous connecter pour ajouter aux favoris', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    const icon = btn.querySelector('i');
    const isCurrentlyFavorite = AppState.isFavorite(studioId);

    if (isCurrentlyFavorite) {
        // Remove from favorites
        AppState.removeFavorite(studioId);
        btn.classList.remove('active');
        if (icon) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
        showNotification('Retiré des favoris', 'success');
    } else {
        // Add to favorites
        AppState.addFavorite(studioId);
        btn.classList.add('active');
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
        showNotification('Ajouté aux favoris', 'success');
    }
}

// ========================================
// Logout
// ========================================
function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
                AppState.logout();
                showNotification('Déconnexion réussie', 'success');
            }
        });
    }
}

// ========================================
// Notifications
// ========================================
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: calc(var(--header-height) + 1rem);
        right: 1rem;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        min-width: 250px;
    `;

    // Add type-specific styles
    if (type === 'success') {
        notification.style.borderLeft = '4px solid #10b981';
        notification.querySelector('i').style.color = '#10b981';
    } else if (type === 'error') {
        notification.style.borderLeft = '4px solid #ef4444';
        notification.querySelector('i').style.color = '#ef4444';
    } else if (type === 'warning') {
        notification.style.borderLeft = '4px solid #f59e0b';
        notification.querySelector('i').style.color = '#f59e0b';
    } else {
        notification.style.borderLeft = '4px solid #6366f1';
        notification.querySelector('i').style.color = '#6366f1';
    }

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || icons.info;
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// ========================================
// Utility Functions
// ========================================

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0
    }).format(price);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export for use in other scripts
window.AppState = AppState;
window.showNotification = showNotification;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.debounce = debounce;
