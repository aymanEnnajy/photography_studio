/**
 * Add/Edit Studio Page JavaScript
 */

let isEditMode = false;
let currentStudioId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuthAndInit();
});

function checkAuthAndInit() {
    // Check if user is authenticated
    if (!window.AppState.isAuthenticated) {
        window.showNotification('Veuillez vous connecter pour accéder à cette page', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }

    // Check if edit mode
    const urlParams = new URLSearchParams(window.location.search);
    currentStudioId = urlParams.get('id');

    if (currentStudioId) {
        isEditMode = true;
        loadStudioForEdit(currentStudioId);
        updatePageForEditMode();
    }

    initForm();
    initPreview();

    // Add listener for status change to show/hide reservedUntil
    const statusSelect = document.getElementById('status');
    const reservedUntilGroup = document.getElementById('reservedUntilGroup');
    const reservedUntilInput = document.getElementById('reservedUntil');

    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            if (statusSelect.value === 'reserved') {
                reservedUntilGroup.style.display = 'block';
                reservedUntilInput.required = true;
            } else {
                reservedUntilGroup.style.display = 'none';
                reservedUntilInput.required = false;
                reservedUntilInput.value = '';
            }
        });
    }
}

function updatePageForEditMode() {
    document.getElementById('pageTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le Studio';
    document.getElementById('pageDescription').textContent = 'Modifiez les informations de votre studio';
    document.getElementById('breadcrumbText').textContent = 'Modifier Studio';
    document.getElementById('submitBtnText').textContent = 'Enregistrer les Modifications';
}

async function loadStudioForEdit(studioId) {
    try {
        const studio = await API.get(`/items/${studioId}`);

        // Fill form with studio data
        document.getElementById('studioName').value = studio.name;
        document.getElementById('city').value = studio.city;
        document.getElementById('pricePerHour').value = studio.price_per_hour;
        document.getElementById('status').value = studio.status;
        document.getElementById('imageUrl').value = studio.image || '';
        document.getElementById('description').value = studio.description || '';

        // Handle reservedUntil
        if (studio.status === 'reserved' && studio.reserved_until) {
            document.getElementById('reservedUntil').value = studio.reserved_until;
            document.getElementById('reservedUntilGroup').style.display = 'block';
            document.getElementById('reservedUntil').required = true;
        }

        // Set services
        const services = studio.services ? studio.services.split(',') : [];
        services.forEach(service => {
            const checkbox = document.querySelector(`input[name="services"][value="${service}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Set equipment
        const equipments = studio.equipments ? studio.equipments.split(',') : [];
        equipments.forEach(equip => {
            const checkbox = document.querySelector(`input[name="equipment"][value="${equip}"]`);
            if (checkbox) checkbox.checked = true;
        });

        // Update preview
        updatePreview();
    } catch (error) {
        console.error(error);
        window.showNotification('Erreur lors du chargement du studio', 'error');
    }
}

function initForm() {
    const form = document.getElementById('studioForm');

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Add input listeners for validation
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', (e) => {
            validateField(e.target);
        });
    });
}

async function handleFormSubmit(e) {
    e.preventDefault();

    // Get form data
    const formData = {
        name: document.getElementById('studioName').value,
        city: document.getElementById('city').value,
        price: parseInt(document.getElementById('pricePerHour').value),
        status: document.getElementById('status').value,
        image: document.getElementById('imageUrl').value,
        description: document.getElementById('description').value,
        services: Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value),
        equipment: Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(cb => cb.value),
        reservedUntil: document.getElementById('reservedUntil').value || null
    };

    // Validate
    if (!validateForm(formData)) {
        return;
    }

    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // API Call
    try {
        if (isEditMode) {
            await API.put(`/items/${currentStudioId}`, formData);
            window.showNotification('Studio modifié avec succès !', 'success');
        } else {
            await API.post('/items', formData);
            window.showNotification('Studio ajouté avec succès !', 'success');
        }

        setTimeout(() => {
            window.location.href = 'studios.html';
        }, 1500);
    } catch (error) {
        console.error(error);
        window.showNotification(error.message || 'Une erreur est survenue', 'error');

        const submitBtn = document.getElementById('submitBtn');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

function validateForm(formData) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    // Validate name
    if (!formData.name || formData.name.trim().length < 3) {
        errorMessage.textContent = 'Le nom du studio doit contenir au moins 3 caractères';
        errorAlert.style.display = 'flex';
        return false;
    }

    // Validate city
    if (!formData.city) {
        errorMessage.textContent = 'Veuillez sélectionner une ville';
        errorAlert.style.display = 'flex';
        return false;
    }

    // Validate price
    if (!formData.price || formData.price < 0) {
        errorMessage.textContent = 'Le tarif doit être un nombre positif';
        errorAlert.style.display = 'flex';
        return false;
    }

    // Validate services
    if (formData.services.length === 0) {
        errorMessage.textContent = 'Veuillez sélectionner au moins un service';
        errorAlert.style.display = 'flex';
        return false;
    }

    errorAlert.style.display = 'none';
    return true;
}

function validateField(field) {
    if (field.hasAttribute('required') && !field.value) {
        field.style.borderColor = '#ef4444';
        return false;
    }

    field.style.borderColor = '';
    return true;
}

function initPreview() {
    // Watch all form inputs for changes
    const form = document.getElementById('studioForm');

    if (form) {
        form.addEventListener('input', updatePreview);
        form.addEventListener('change', updatePreview);
    }
}

function updatePreview() {
    const previewCard = document.getElementById('previewCard');
    if (!previewCard) return;

    // Get current form values
    const name = document.getElementById('studioName').value || 'Nom du Studio';
    const city = document.getElementById('city').value || 'Ville';
    const price = document.getElementById('pricePerHour').value || '0';
    const status = document.getElementById('status').value || 'available';

    // Get selected services
    const services = Array.from(document.querySelectorAll('input[name="services"]:checked')).map(cb => cb.value);

    // Get selected equipment
    const equipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(cb => cb.value);

    // Update preview card
    const statusBadge = previewCard.querySelector('.studio-badge');
    statusBadge.className = `studio-badge ${status}`;
    statusBadge.textContent = status === 'available' ? 'Disponible' : 'Réservé';

    const studioName = previewCard.querySelector('.studio-name');
    studioName.textContent = name;

    const studioLocation = previewCard.querySelector('.studio-location span');
    const cityNames = {
        'casablanca': 'Casablanca',
        'rabat': 'Rabat',
        'marrakech': 'Marrakech',
        'tanger': 'Tanger',
        'agadir': 'Agadir',
        'fès': 'Fès',
        'fes': 'Fès',
        'meknès': 'Meknès',
        'meknes': 'Meknès',
        'oujda': 'Oujda',
        'kénitra': 'Kénitra',
        'kenitra': 'Kénitra'
    };
    studioLocation.textContent = cityNames[city] || city;

    const priceAmount = previewCard.querySelector('.price-amount');
    priceAmount.textContent = `${price} DH`;

    // Update Image Preview
    const imageUrl = document.getElementById('imageUrl').value;
    const imagePreviewContainer = previewCard.querySelector('.studio-card-image');
    if (imageUrl && imageUrl.startsWith('http')) {
        imagePreviewContainer.innerHTML = `
            <div class="studio-badge ${status}">${status === 'available' ? 'Disponible' : 'Réservé'}</div>
            <button class="favorite-btn">
                <i class="far fa-heart"></i>
            </button>
            <img src="${imageUrl}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">
        `;
    } else {
        imagePreviewContainer.innerHTML = `
            <div class="studio-badge ${status}">${status === 'available' ? 'Disponible' : 'Réservé'}</div>
            <button class="favorite-btn">
                <i class="far fa-heart"></i>
            </button>
            <div class="image-placeholder">
                <i class="fas fa-image"></i>
            </div>
        `;
    }

    // Update services
    const servicesContainer = previewCard.querySelector('.studio-services');
    if (services.length > 0) {
        const serviceIcons = {
            mariage: 'fa-ring',
            portrait: 'fa-user',
            commercial: 'fa-briefcase'
        };
        const serviceNames = {
            mariage: 'Mariage',
            portrait: 'Portrait',
            commercial: 'Commercial'
        };
        servicesContainer.innerHTML = services.map(service => {
            return `<span class="service-tag"><i class="fas ${serviceIcons[service]}"></i> ${serviceNames[service]}</span>`;
        }).join('');
    } else {
        servicesContainer.innerHTML = '<span class="service-tag"><i class="fas fa-ring"></i> Services</span>';
    }

    // Update equipment
    const equipmentContainer = previewCard.querySelector('.studio-equipment');
    if (equipment.length > 0) {
        const equipIcons = {
            lighting: 'fa-lightbulb',
            backdrop: 'fa-palette',
            cyclorama: 'fa-circle',
            makeup: 'fa-magic',
            wardrobe: 'fa-door-open',
            wifi: 'fa-wifi',
            parking: 'fa-parking',
            audio: 'fa-music'
        };
        const equipTitles = {
            lighting: 'Éclairage Professionnel',
            backdrop: 'Fond Vert/Blanc',
            cyclorama: 'Cyclorama',
            makeup: 'Maquillage',
            wardrobe: 'Vestiaire',
            wifi: 'Wifi',
            parking: 'Parking',
            audio: 'Audio'
        };
        equipmentContainer.innerHTML = equipment.slice(0, 3).map(equip => {
            return `<span class="equipment-item" title="${equipTitles[equip]}"><i class="fas ${equipIcons[equip]}"></i></span>`;
        }).join('');
    } else {
        equipmentContainer.innerHTML = '<span class="equipment-item" title="Équipements"><i class="fas fa-lightbulb"></i></span>';
    }
}
