/**
 * Favorites Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadFavorites();
    initClearAllButton();
});

function checkAuth() {
    if (!window.AppState.isAuthenticated) {
        document.getElementById('authRequired').style.display = 'flex';
        document.getElementById('favoritesContent').style.display = 'none';
    } else {
        document.getElementById('authRequired').style.display = 'none';
        document.getElementById('favoritesContent').style.display = 'block';
    }
}

async function loadFavorites() {
    if (!window.AppState.isAuthenticated) return;

    const favoritesGrid = document.getElementById('favoritesGrid');
    const emptyState = document.getElementById('emptyState');
    const favoritesCount = document.getElementById('favoritesCount');

    try {
        const favoriteStudios = await API.get('/favorites/my-favorites');

        // Map DB fields if necessary (studios returned from API should match frontend expectation mostly)
        // API returns studios joined with favorites, so they are studio objects.
        const mappedStudios = favoriteStudios.map(s => ({
            ...s,
            equipment: s.equipments ? s.equipments.split(',') : [],
            services: s.services ? s.services.split(',') : [],
            price: s.price_per_hour
        }));

        // Update count
        if (favoritesCount) {
            favoritesCount.textContent = mappedStudios.length;
        }

        // Show/hide empty state
        if (mappedStudios.length === 0) {
            emptyState.style.display = 'flex';
            favoritesGrid.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            favoritesGrid.style.display = 'grid';

            // Render studios
            favoritesGrid.innerHTML = '';
            mappedStudios.forEach((studio, index) => {
                const card = createStudioCard(studio, index);
                favoritesGrid.appendChild(card);
            });

            // Re-initialize favorite buttons
            initializeFavoriteButtons();
        }
    } catch (error) {
        console.error('Failed to load favorites:', error);
    }
}

function createStudioCard(studio, index) {
    const card = document.createElement('div');
    card.className = 'studio-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index * 100).toString());

    const servicesHTML = studio.services.map(service => {
        const icons = {
            mariage: 'fa-ring',
            portrait: 'fa-user',
            commercial: 'fa-briefcase'
        };
        const names = {
            mariage: 'Mariage',
            portrait: 'Portrait',
            commercial: 'Commercial'
        };
        return `<span class="service-tag"><i class="fas ${icons[service]}"></i> ${names[service]}</span>`;
    }).join('');

    const equipmentHTML = studio.equipment.slice(0, 3).map(equip => {
        const icons = {
            lighting: 'fa-lightbulb',
            backdrop: 'fa-palette',
            cyclorama: 'fa-circle',
            makeup: 'fa-magic',
            wardrobe: 'fa-door-open',
            wifi: 'fa-wifi',
            parking: 'fa-parking',
            audio: 'fa-music'
        };
        const titles = {
            lighting: 'Éclairage Professionnel',
            backdrop: 'Fond Vert/Blanc',
            cyclorama: 'Cyclorama',
            makeup: 'Maquillage',
            wardrobe: 'Vestiaire',
            wifi: 'Wifi',
            parking: 'Parking',
            audio: 'Audio'
        };
        return `<span class="equipment-item" title="${titles[equip]}"><i class="fas ${icons[equip]}"></i></span>`;
    }).join('');

    card.innerHTML = `
        <div class="studio-card-image">
            <div class="studio-badge ${studio.status}">${studio.status === 'available' ? 'Disponible' : 'Réservé'}</div>
            <button class="favorite-btn active" data-studio-id="${studio.id}">
                <i class="fas fa-heart"></i>
            </button>
            <div class="image-placeholder">
                <i class="fas fa-image"></i>
            </div>
        </div>
        <div class="studio-card-content">
            <div class="studio-header">
                <h3 class="studio-name">${studio.name}</h3>
                <div class="studio-rating">
                    <i class="fas fa-star"></i>
                    <span>${studio.rating}</span>
                </div>
            </div>
            <div class="studio-location">
                <i class="fas fa-map-marker-alt"></i>
                <span>${studio.city}, France</span>
            </div>
            <div class="studio-services">
                ${servicesHTML}
            </div>
            <div class="studio-equipment">
                ${equipmentHTML}
            </div>
            <div class="studio-footer">
                <div class="studio-price">
                    <span class="price-amount">${studio.price}€</span>
                    <span class="price-unit">/heure</span>
                </div>
                <a href="studio-detail.html?id=${studio.id}" class="btn btn-primary btn-sm">
                    Voir Détails
                </a>
            </div>
        </div>
    `;

    return card;
}

function initializeFavoriteButtons() {
    const favoriteButtons = document.querySelectorAll('.favorite-btn');

    favoriteButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const studioId = btn.dataset.studioId;
            btn.disabled = true;

            const success = await window.AppState.removeFavorite(studioId);
            if (success) {
                window.showNotification('Retiré des favoris', 'success');
                // Reload favorites
                setTimeout(() => {
                    loadFavorites();
                }, 300);
            } else {
                window.showNotification('Erreur lors du retrait des favoris', 'error');
                btn.disabled = false;
            }
        });
    });
}

function initClearAllButton() {
    const clearAllBtn = document.getElementById('clearAllFavorites');

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer tous vos favoris ?')) {
                window.AppState.favorites = [];
                localStorage.setItem('favorites', JSON.stringify([]));
                window.showNotification('Tous les favoris ont été supprimés', 'success');
                loadFavorites();
            }
        });
    }
}
