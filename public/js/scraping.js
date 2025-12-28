document.addEventListener('DOMContentLoaded', () => {
    const scrapingForm = document.getElementById('scrapingForm');
    const scrapingOverlay = document.getElementById('scrapingOverlay');
    const scrapingResult = document.getElementById('scrapingResult');
    const downloadLink = document.getElementById('downloadLink');

    // Protect the page using AppState
    if (!window.AppState.isAuthenticated) {
        window.showNotification('Vous devez être connecté pour accéder à cette page.', 'warning');
        window.location.href = 'login.html';
        return;
    }

    scrapingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const city = document.getElementById('city').value;
        const keyword = document.getElementById('keyword').value;

        // Show loading state
        scrapingForm.style.display = 'none';
        scrapingOverlay.style.display = 'flex';

        try {
            // Use the API helper which handles tokens from cookies automatically
            const data = await window.API.get(`/scraping/trigger?city=${encodeURIComponent(city)}&keyword=${encodeURIComponent(keyword)}`);

            if (data.success && data.sheetUrl) {
                // Show success state
                scrapingOverlay.style.display = 'none';
                scrapingResult.style.display = 'block';
                downloadLink.href = data.sheetUrl;
            } else {
                throw new Error(data.error || 'Une erreur est survenue lors du scraping.');
            }
        } catch (error) {
            console.error('Scraping error:', error);

            let errorMsg = error.message;
            if (error.n8nStatus) {
                errorMsg += ` (Status: ${error.n8nStatus})`;
            }
            if (error.n8nError) {
                errorMsg += `\nn8n Error: ${error.n8nError}`;
            }

            window.showNotification(errorMsg, 'error');
            // Reset UI
            scrapingOverlay.style.display = 'none';
            scrapingForm.style.display = 'block';
        }
    });
});
