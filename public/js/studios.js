/**
 * Studios Listing Page JavaScript
 * Handles filtering, pagination, and studio display
 */

// State
let allStudios = [];
let currentPage = 1;
const itemsPerPage = 6;
let filteredStudios = [];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    initPagination();
    loadStudios();
});

async function loadStudios() {
    try {
        const studios = await API.get('/items');
        allStudios = studios.map(s => ({
            ...s,
            // Map DB fields to frontend expectations if needed
            // DB: equipments (string), services (string)
            // Frontend: equipment (array), services (array)
            equipment: s.equipments ? s.equipments.split(',') : [],
            services: s.services ? s.services.split(',') : [],
            price: s.price_per_hour
        }));
        filteredStudios = [...allStudios];
        updateResultsCount();
        renderStudios();
    } catch (error) {
        console.error('Failed to load studios:', error);
        document.getElementById('studiosGrid').innerHTML = '<div class="error">Erreur lors du chargement des studios</div>';
    }
}

// Initialize filters
function initFilters() {
    const searchInput = document.getElementById('searchInput');
    const serviceCheckboxes = document.querySelectorAll('input[name="service"]');
    const statusRadios = document.querySelectorAll('input[name="status"]');
    const priceRange = document.getElementById('priceRange');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    const cityFilter = document.getElementById('cityFilter');
    const equipmentCheckboxes = document.querySelectorAll('input[name="equipment"]');
    const resetBtn = document.getElementById('resetFilters');
    const applyBtn = document.getElementById('applyFilters');
    const mobileFilterToggle = document.getElementById('mobileFilterToggle');
    const filtersSidebar = document.getElementById('filtersSidebar');
    const closeFilters = document.getElementById('closeFilters');
    const sortBy = document.getElementById('sortBy');

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', window.debounce(applyFilters, 300));
    }

    // Price range
    if (priceRange && minPrice && maxPrice) {
        priceRange.addEventListener('input', (e) => {
            maxPrice.textContent = `${e.target.value} DH`;
        });
    }

    // Sort
    if (sortBy) {
        sortBy.addEventListener('change', () => {
            applySorting();
            renderStudios();
        });
    }

    // Reset filters
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }

    // Apply filters
    if (applyBtn) {
        applyBtn.addEventListener('click', () => {
            applyFilters();
            if (filtersSidebar) {
                filtersSidebar.classList.remove('active');
            }
        });
    }

    // Mobile filter toggle
    if (mobileFilterToggle && filtersSidebar) {
        mobileFilterToggle.addEventListener('click', () => {
            filtersSidebar.classList.add('active');
        });
    }

    if (closeFilters && filtersSidebar) {
        closeFilters.addEventListener('click', () => {
            filtersSidebar.classList.remove('active');
        });
    }

    // Add change listeners to all filter inputs
    [serviceCheckboxes, statusRadios, equipmentCheckboxes].forEach(nodeList => {
        nodeList.forEach(input => {
            input.addEventListener('change', window.debounce(applyFilters, 300));
        });
    });

    if (cityFilter) {
        cityFilter.addEventListener('change', applyFilters);
    }
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const selectedServices = Array.from(document.querySelectorAll('input[name="service"]:checked')).map(cb => cb.value);
    const selectedStatus = document.querySelector('input[name="status"]:checked')?.value || 'all';
    const maxPriceValue = parseInt(document.getElementById('priceRange')?.value || 3000);
    const selectedCity = document.getElementById('cityFilter')?.value || '';
    const selectedEquipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(cb => cb.value);

    filteredStudios = allStudios.filter(studio => {
        // Search filter
        if (searchTerm && !studio.name.toLowerCase().includes(searchTerm)) {
            return false;
        }

        // Services filter
        if (selectedServices.length > 0) {
            const hasService = selectedServices.some(service => studio.services.includes(service));
            if (!hasService) return false;
        }

        // Status filter
        if (selectedStatus !== 'all' && studio.status !== selectedStatus) {
            return false;
        }

        // Price filter
        if (studio.price > maxPriceValue) {
            return false;
        }

        // City filter
        if (selectedCity && studio.city.toLowerCase() !== selectedCity) {
            return false;
        }

        // Equipment filter
        if (selectedEquipment.length > 0) {
            const hasEquipment = selectedEquipment.every(equip => studio.equipment.includes(equip));
            if (!hasEquipment) return false;
        }

        return true;
    });

    applySorting();
    currentPage = 1;
    updateResultsCount();
    renderStudios();
    updatePagination();
}

// Apply sorting
function applySorting() {
    const sortBy = document.getElementById('sortBy')?.value || 'newest';

    switch (sortBy) {
        case 'price-asc':
            filteredStudios.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredStudios.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filteredStudios.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
            filteredStudios.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            // newest - keep original order
            break;
    }
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('input[name="service"]').forEach(cb => cb.checked = false);
    document.querySelector('input[name="status"][value="all"]').checked = true;
    document.getElementById('priceRange').value = 3000;
    document.getElementById('maxPrice').textContent = '3000 DH';
    document.getElementById('cityFilter').value = '';
    document.querySelectorAll('input[name="equipment"]').forEach(cb => cb.checked = false);

    applyFilters();
}

// Update results count
function updateResultsCount() {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = filteredStudios.length;
    }
}

// Render studios
function renderStudios() {
    const studiosGrid = document.getElementById('studiosGrid');
    if (!studiosGrid) return;

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const studiosToShow = filteredStudios.slice(startIndex, endIndex);

    // Clear grid
    studiosGrid.innerHTML = '';

    // Render studios
    if (studiosToShow.length === 0) {
        studiosGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <div class="empty-state-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>Aucun Studio Trouvé</h3>
                <p>Essayez de modifier vos critères de recherche</p>
            </div>
        `;
        return;
    }

    studiosToShow.forEach((studio, index) => {
        const studioCard = createStudioCard(studio, index);
        studiosGrid.appendChild(studioCard);
    });

    // Re-initialize favorites
    window.AppState.init();
    const favoriteBtns = studiosGrid.querySelectorAll('.favorite-btn');
    favoriteBtns.forEach(btn => {
        const studioId = btn.dataset.studioId;
        if (window.AppState.isFavorite(studioId)) {
            btn.classList.add('active');
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('far');
                icon.classList.add('fas');
            }
        }

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(btn, studioId);
        });
    });
}

// Create studio card
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
            <button class="favorite-btn" data-studio-id="${studio.id}">
                <i class="far fa-heart"></i>
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
                    <span class="price-amount">${studio.price} DH</span>
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

function toggleFavorite(btn, studioId) {
    if (!window.AppState.isAuthenticated) {
        window.showNotification('Veuillez vous connecter pour ajouter aux favoris', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    const icon = btn.querySelector('i');
    const isCurrentlyFavorite = window.AppState.isFavorite(studioId);

    if (isCurrentlyFavorite) {
        window.AppState.removeFavorite(studioId);
        btn.classList.remove('active');
        if (icon) {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
        window.showNotification('Retiré des favoris', 'success');
    } else {
        window.AppState.addFavorite(studioId);
        btn.classList.add('active');
        if (icon) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        }
        window.showNotification('Ajouté aux favoris', 'success');
    }
}

// Initialize pagination
function initPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderStudios();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredStudios.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderStudios();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredStudios.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const paginationNumbers = document.getElementById('paginationNumbers');

    // Update button states
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // Update page numbers
    if (paginationNumbers) {
        paginationNumbers.innerHTML = '';

        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = 'pagination-number';
            if (i === currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                renderStudios();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationNumbers.appendChild(pageBtn);
        }

        if (totalPages > 5) {
            const dots = document.createElement('span');
            dots.className = 'pagination-dots';
            dots.textContent = '...';
            paginationNumbers.appendChild(dots);

            const lastPageBtn = document.createElement('button');
            lastPageBtn.className = 'pagination-number';
            lastPageBtn.textContent = totalPages;
            lastPageBtn.addEventListener('click', () => {
                currentPage = totalPages;
                renderStudios();
                updatePagination();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            paginationNumbers.appendChild(lastPageBtn);
        }
    }
}
