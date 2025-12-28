document.addEventListener('DOMContentLoaded', () => {
    const scrapingForm = document.getElementById('scrapingForm');
    const scrapingOverlay = document.getElementById('scrapingOverlay');
    const scrapingResult = document.getElementById('scrapingResult');
    const downloadLink = document.getElementById('downloadLink');
    const token = localStorage.getItem('token');

    // Protect the page
    if (!token) {
        alert('Vous devez être connecté pour accéder à cette page.');
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
            const response = await fetch('/api/scraping/trigger', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ city, keyword })
            });

            const data = await response.json();

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
            alert('Erreur: ' + error.message);
            // Reset UI
            scrapingOverlay.style.display = 'none';
            scrapingForm.style.display = 'block';
        }
    });
});
