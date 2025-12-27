/**
 * My Bookings Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadBookings();
});

function checkAuth() {
    if (!window.AppState.isAuthenticated) {
        document.getElementById('authRequired').style.display = 'flex';
        document.getElementById('bookingsContent').style.display = 'none';
    } else {
        document.getElementById('authRequired').style.display = 'none';
        document.getElementById('bookingsContent').style.display = 'block';
    }
}

async function loadBookings() {
    if (!window.AppState.isAuthenticated) return;

    const bookingsList = document.getElementById('bookingsList');
    const emptyState = document.getElementById('emptyState');

    try {
        const bookings = await API.get('/bookings/my-bookings');

        if (bookings.length === 0) {
            emptyState.style.display = 'flex';
            bookingsList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            bookingsList.style.display = 'grid';

            bookingsList.innerHTML = bookings.map(booking => createBookingCard(booking)).join('');
        }
    } catch (error) {
        console.error('Failed to load bookings:', error);
        window.showNotification('Erreur chargement réservations', 'error');
    }
}

function createBookingCard(booking) {
    const date = new Date(booking.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
        <div class="studio-card" style="display: flex; flex-direction: row; flex-wrap: wrap; align-items: center; padding: 1.5rem; gap: 1.5rem;">
            <div style="flex: 1; min-width: 250px;">
                <div class="studio-badge ${booking.status === 'confirmed' ? 'available' : 'reserved'}" style="margin-bottom: 0.5rem; display: inline-block;">
                    ${booking.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                </div>
                <h3 style="margin: 0; font-size: 1.25rem;">${booking.studio_name}</h3>
                <p style="color: var(--text-secondary); margin: 0.25rem 0;">
                    <i class="fas fa-map-marker-alt"></i> ${booking.city}
                </p>
            </div>
            
            <div style="flex: 1; min-width: 200px; display: flex; align-items: center; gap: 1rem;">
                <div style="background: var(--bg-body); padding: 0.75rem; border-radius: var(--radius-md); text-align: center; min-width: 120px;">
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Date</div>
                    <div style="font-weight: 600; color: var(--primary-color);">${date}</div>
                </div>
                <div>
                    <div style="font-size: 0.875rem; color: var(--text-secondary);">Prix</div>
                    <div style="font-weight: 600;">${booking.price_per_hour}€ <span style="font-size: 0.8em; font-weight: normal;">/h</span></div>
                </div>
            </div>
            
            <div style="min-width: 150px; text-align: right;">
                <a href="studio-detail.html?id=${booking.item_id}" class="btn btn-outline btn-sm">
                    Voir Studio
                </a>
            </div>
        </div>
    `;
}
