/**
 * Studio Detail Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    loadStudioDetails();
    initFavoriteButton();
    initStudioActions();
});

async function loadStudioDetails() {
    // Get studio ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const studioId = urlParams.get('id');

    if (!studioId) {
        window.location.href = 'studios.html';
        return;
    }

    try {
        const studioData = await API.get(`/items/${studioId}`);

        // Map data
        const studio = {
            ...studioData,
            equipment: studioData.equipments ? studioData.equipments.split(',') : [],
            services: studioData.services ? studioData.services.split(',') : [],
            price: studioData.price_per_hour,
            userId: studioData.created_by, // Map for ownership check
            // Use default description if missing (DB logic might need update)
            description: studioData.description || 'Aucune description disponible.'
        };

        // Update page content
        updateStudioDetails(studio);

        // Check if user owns this studio
        checkStudioOwnership(studio);
    } catch (error) {
        console.error('Error loading studio details:', error);
        console.log('Attempted ID:', studioId);
        window.showNotification(`Studio introuvable (ID: ${studioId})`, 'error');
        setTimeout(() => {
            window.location.href = 'studios.html';
        }, 3000);
    }
}

function updateStudioDetails(studio) {
    // Update breadcrumb and titles
    document.getElementById('studioName').textContent = studio.name;
    document.getElementById('studioNameLarge').textContent = studio.name;

    // Update location
    document.getElementById('studioLocation').textContent = `${studio.city}, France`;

    // Update status
    const statusBadge = document.getElementById('studioStatus');
    if (studio.status === 'available') {
        statusBadge.innerHTML = '<span class="badge-large available"><i class="fas fa-check-circle"></i> Disponible</span>';
    } else {
        statusBadge.innerHTML = '<span class="badge-large reserved"><i class="fas fa-times-circle"></i> Réservé</span>';
    }

    // Update price
    document.getElementById('studioPrice').textContent = studio.price;

    // Update services
    const servicesContainer = document.getElementById('studioServices');
    servicesContainer.innerHTML = studio.services.map(service => {
        const icons = { mariage: 'fa-ring', portrait: 'fa-user', commercial: 'fa-briefcase' };
        const names = { mariage: 'Mariage', portrait: 'Portrait', commercial: 'Commercial' };
        return `<span class="service-tag-large"><i class="fas ${icons[service]}"></i> ${names[service]}</span>`;
    }).join('');

    // Update equipment
    const equipmentContainer = document.getElementById('studioEquipment');
    const equipmentNames = {
        lighting: 'Éclairage professionnel (Softbox, Parapluie, LED)',
        backdrop: 'Fonds Blanc, Noir et Vert',
        cyclorama: 'Cyclorama professionnel',
        makeup: 'Espace maquillage',
        wardrobe: 'Vestiaire',
        wifi: 'Wifi Haut Débit',
        parking: 'Parking disponible',
        audio: 'Système audio Bluetooth'
    };
    equipmentContainer.innerHTML = studio.equipment.map(equip => {
        return `<li class="equipment-item-large"><i class="fas fa-check-circle"></i><span>${equipmentNames[equip]}</span></li>`;
    }).join('');

    // Update description and add booking section
    const descriptionElement = document.getElementById('studioDescription');
    const container = descriptionElement.parentElement;

    // Check if booking section already exists
    if (!container.querySelector('.booking-section')) {
        const bookingHTML = `
            <div class="booking-section" style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                <h3><i class="fas fa-calendar-alt"></i> Réserver ce Studio</h3>
                <form id="bookingForm" style="margin-top: 1rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
                    <div style="flex: 1; min-width: 200px;">
                        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Date de réservation</label>
                        <input type="date" id="bookingDate" class="form-input" required min="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <button type="submit" class="btn btn-primary" id="bookingBtn">
                        Réserver
                    </button>
                </form>
                <div id="bookingMessage" style="margin-top: 1rem; display: none;"></div>
            </div>
        `;
        descriptionElement.insertAdjacentHTML('afterend', bookingHTML);
    }

    // Inject Reviews Section
    if (!container.querySelector('.reviews-section')) {
        const reviewsHTML = `
            <div class="reviews-section" style="margin-top: 2rem;">
                <h3><i class="fas fa-star"></i> Avis & Notes</h3>
                <div id="reviewsList" style="margin-top: 1rem; display: flex; flex-direction: column; gap: 1rem;"></div>
                
                <div id="reviewFormContainer" style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color);">
                    <h4>Laisser un avis</h4>
                    <form id="reviewForm" style="margin-top: 1rem;">
                        <input type="hidden" id="ratingInput">
                        <div class="star-rating" style="display: flex; gap: 0.5rem; font-size: 1.5rem; cursor: pointer; margin-bottom: 1rem;">
                            <i class="far fa-star" data-rating="1"></i>
                            <i class="far fa-star" data-rating="2"></i>
                            <i class="far fa-star" data-rating="3"></i>
                            <i class="far fa-star" data-rating="4"></i>
                            <i class="far fa-star" data-rating="5"></i>
                        </div>
                        <textarea id="reviewComment" class="form-input" rows="3" placeholder="Votre expérience..." style="margin-bottom: 1rem;"></textarea>
                        <button type="submit" class="btn btn-primary">Publier</button>
                    </form>
                </div>
            </div>`;
        descriptionElement.insertAdjacentHTML('afterend', reviewsHTML);
    }

    document.getElementById('studioDescription').textContent = studio.description;

    // Init Reviews
    initReviews(studio.id);

    // Init Booking Logic
    initBookingForm(studio.id);

    // Set favorite button state
    const favoriteBtn = document.getElementById('favoriteBtnDetail');
    if (favoriteBtn) {
        favoriteBtn.dataset.studioId = studio.id;
        if (window.AppState.isFavorite(studio.id)) {
            favoriteBtn.classList.add('active');
            const icon = favoriteBtn.querySelector('i');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        }
    }
}

function initFavoriteButton() {
    const favoriteBtn = document.getElementById('favoriteBtnDetail');

    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const studioId = favoriteBtn.dataset.studioId;

            if (!window.AppState.isAuthenticated) {
                window.showNotification('Veuillez vous connecter pour ajouter aux favoris', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }

            const icon = favoriteBtn.querySelector('i');
            const isFavorite = window.AppState.isFavorite(studioId);

            try {
                if (isFavorite) {
                    await API.delete(`/favorites/${studioId}`);
                    window.AppState.removeFavorite(studioId);

                    favoriteBtn.classList.remove('active');
                    if (icon) {
                        icon.classList.remove('fas');
                        icon.classList.add('far');
                    }
                    window.showNotification('Retiré des favoris', 'success');
                } else {
                    await API.post(`/favorites/${studioId}`);
                    window.AppState.addFavorite(studioId);

                    favoriteBtn.classList.add('active');
                    if (icon) {
                        icon.classList.remove('far');
                        icon.classList.add('fas');
                    }
                    window.showNotification('Ajouté aux favoris', 'success');
                }
            } catch (error) {
                console.error(error);
                window.showNotification('Erreur lors de la mise à jour des favoris', 'error');
            }
        });
    }
}

function checkStudioOwnership(studio) {
    // Check if current user owns this studio
    const currentUser = window.AppState.user;
    const studioActions = document.getElementById('studioActions');

    if (currentUser && currentUser.id === studio.userId) {
        studioActions.style.display = 'flex';
    }
}

function initStudioActions() {
    const editBtn = document.getElementById('editStudioBtn');
    const deleteBtn = document.getElementById('deleteStudioBtn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const studioId = urlParams.get('id');
            window.location.href = `add-studio.html?id=${studioId}`;
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Êtes-vous sûr de vouloir supprimer ce studio ?')) {
                // Simulate deletion
                window.showNotification('Studio supprimé avec succès', 'success');
                setTimeout(() => {
                    window.location.href = 'studios.html';
                }, 1500);
            }
        });
    }
}

function initBookingForm(studioId) {
    const bookingForm = document.getElementById('bookingForm');
    const bookingDate = document.getElementById('bookingDate');
    const bookingBtn = document.getElementById('bookingBtn');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!window.AppState.isAuthenticated) {
                window.showNotification('Veuillez vous connecter pour réserver', 'warning');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                return;
            }

            const date = bookingDate.value;
            if (!date) return;

            bookingBtn.classList.add('loading');
            bookingBtn.disabled = true;

            try {
                await API.post('/bookings', { itemId: studioId, date });
                window.showNotification('Réservation confirmée !', 'success');
                bookingForm.reset();
                // Optionally refresh availability here
            } catch (error) {
                console.error(error);
                window.showNotification(error.message || 'Erreur lors de la réservation', 'error');
            } finally {
                bookingBtn.classList.remove('loading');
                bookingBtn.disabled = false;
            }
        });
    }
}
