const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Activer CORS pour votre site
app.use(cors({
    origin: 'https://photographys-tudio.ayman93011.workers.dev',
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

// Middleware pour parser le JSON
app.use(express.json());

// Route proxy vers n8n
app.post('/api/search-maps', async (req, res) => {
    try {
        console.log('📤 Requête reçue:', req.body);
        
        // Forward vers n8n
        const response = await axios.post(
            'https://n8n.zackdev.io/webhook/scraping',
            req.body,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 30000 // 30 secondes timeout
            }
        );
        
        console.log('✅ Réponse n8n:', response.data);
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ Erreur proxy:', error.message);
        
        if (error.response) {
            // Erreur de n8n
            res.status(error.response.status).json({
                error: error.response.data || error.message
            });
        } else if (error.request) {
            // Pas de réponse de n8n
            res.status(504).json({
                error: 'n8n ne répond pas',
                message: error.message
            });
        } else {
            // Erreur interne
            res.status(500).json({
                error: 'Erreur interne du proxy',
                message: error.message
            });
        }
    }
});

// Route test
app.get('/api/test', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Proxy server running',
        timestamp: new Date().toISOString()
    });
});

// Route racine
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Proxy Server</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .endpoint { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }
                code { background: #e0e0e0; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>🚀 Proxy Server Running</h1>
            <p>Ce serveur proxy permet à votre site web d'accéder à n8n sans problèmes CORS.</p>
            
            <div class="endpoint">
                <h3>Endpoints disponibles :</h3>
                <p><strong>GET</strong> <code>/api/test</code> - Test de connexion</p>
                <p><strong>POST</strong> <code>/api/search-maps</code> - Proxy vers n8n</p>
            </div>
            
            <div class="endpoint">
                <h3>Pour votre site web :</h3>
                <p>Dans votre fichier <code>search.html</code>, remplacez :</p>
                <code>const N8N_WEBHOOK_URL = 'https://n8n.zackdev.io/webhook/scraping';</code>
                <p>Par :</p>
                <code>const PROXY_URL = 'http://localhost:3000/api/search-maps';</code>
            </div>
            
            <p>Serveur démarré sur le port 3000</p>
        </body>
        </html>
    `);
});

// Port d'écoute
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Proxy server running on port ${PORT}`);
    console.log(`🌐 Test URL: http://localhost:${PORT}/api/test`);
    console.log(`🌐 Interface web: http://localhost:${PORT}`);
    console.log(`🔗 Use this in your HTML: http://localhost:${PORT}/api/search-maps`);
});