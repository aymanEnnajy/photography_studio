import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { sign } from 'jsonwebtoken'
import { hash, compare } from 'bcryptjs'
import { authMiddleware } from './middleware/auth'

import { serveStatic } from 'hono/cloudflare-workers'
import manifest from '__STATIC_CONTENT_MANIFEST'

const app = new Hono()

app.onError((err, c) => {
    console.error('Runtime Error:', err)
    return c.text(`Internal Server Error: ${err.message}\n${err.stack}`, 500)
})

app.use('/*', cors())

// Auth key for JWT
const getJwtSecret = (c) => c.env.JWT_SECRET

app.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Register
app.post('/api/auth/register', async (c) => {
    const { username, email, password } = await c.req.json();

    if (!username || !email || !password) {
        return c.json({ error: 'Missing fields' }, 400);
    }

    // Check if user exists
    const existing = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (existing) {
        return c.json({ error: 'Email already exists' }, 409);
    }

    const hashedPassword = await hash(password, 10);

    try {
        const result = await c.env.DB.prepare(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)'
        ).bind(username, email, hashedPassword).run();

        return c.json({ message: 'User registered successfully', success: true }, 201);
    } catch (e) {
        return c.json({ error: 'Registration failed', details: e.message }, 500);
    }
});

// Login
app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json();

    if (!email || !password) {
        return c.json({ error: 'Missing credentials' }, 400);
    }

    const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

    if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const isValid = await compare(password, user.password);
    if (!isValid) {
        return c.json({ error: 'Invalid credentials' }, 401);
    }

    const token = sign({ id: user.id, email: user.email, role: user.role }, c.env.JWT_SECRET, { expiresIn: '24h' });

    // Remove password from response
    delete user.password;

    return c.json({
        message: 'Login successful',
        token,
        user
    });
});

// Get Current User
app.get('/api/auth/me', authMiddleware, async (c) => {
    const payload = c.get('user');
    const user = await c.env.DB.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').bind(payload.id).first();

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user);
});

// Test DB connection
app.get('/api/test-db', async (c) => {
    try {
        const { results } = await c.env.DB.prepare('SELECT 1 as val').all();
        return c.json({ message: 'Database connection successful', data: results });
    } catch (e) {
        return c.json({ error: 'Database connection failed', details: e.message }, 500);
    }
});

// --- Studios API ---

// List Studios (with filters)
app.get('/api/items', async (c) => {
    const { category, city, status, priceMax, search } = c.req.query();

    let query = 'SELECT * FROM studios WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
        query += ' AND services LIKE ?';
        params.push(`%${category}%`);
    }

    if (city && city !== 'all') {
        query += ' AND city = ?';
        params.push(city);
    }

    if (status && status !== 'all') {
        query += ' AND status = ?';
        params.push(status);
    }

    if (priceMax) {
        query += ' AND price_per_hour <= ?';
        params.push(priceMax);
    }

    if (search) {
        query += ' AND (name LIKE ? OR city LIKE ?)';
        params.push(`%${search}%`);
        params.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    try {
        const { results } = await c.env.DB.prepare(query).bind(...params).all();
        return c.json(results);
    } catch (e) {
        return c.json({ error: 'Failed to fetch studios', details: e.message }, 500);
    }
});

// Get Studio Details
app.get('/api/items/:id', async (c) => {
    const id = c.req.param('id');
    const studio = await c.env.DB.prepare('SELECT * FROM studios WHERE id = ?').bind(id).first();

    if (!studio) {
        return c.json({ error: 'Studio not found' }, 404);
    }
    return c.json(studio);
});

// Create Studio (Protected)
app.post('/api/items', authMiddleware, async (c) => {
    const user = c.get('user');
    const { name, services, price, city, equipments, status, image, description } = await c.req.json();

    if (!name || !price || !city) {
        return c.json({ error: 'Missing required fields' }, 400);
    }

    const servicesStr = Array.isArray(services) ? services.join(',') : (services || '');
    const equipmentsStr = Array.isArray(equipments) ? equipments.join(',') : (equipments || '');

    try {
        const result = await c.env.DB.prepare(
            `INSERT INTO studios (name, services, price_per_hour, city, equipments, status, image, created_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(name, servicesStr, price, city, equipmentsStr, status || 'available', image, user.id).run();

        return c.json({ message: 'Studio created successfully', id: result.meta.last_row_id }, 201);
    } catch (e) {
        return c.json({ error: 'Failed to create studio', details: e.message }, 500);
    }
});

// Update Studio (Protected)
app.put('/api/items/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');
    const updates = await c.req.json();

    const studio = await c.env.DB.prepare('SELECT created_by FROM studios WHERE id = ?').bind(id).first();
    if (!studio) {
        return c.json({ error: 'Studio not found' }, 404);
    }
    if (studio.created_by !== user.id && user.role !== 'admin') {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    const fields = [];
    const values = [];

    if (updates.name) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.city) { fields.push('city = ?'); values.push(updates.city); }
    if (updates.price) { fields.push('price_per_hour = ?'); values.push(updates.price); }
    if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.image) { fields.push('image = ?'); values.push(updates.image); }
    if (updates.services) {
        fields.push('services = ?');
        values.push(Array.isArray(updates.services) ? updates.services.join(',') : updates.services);
    }
    if (updates.equipments) {
        fields.push('equipments = ?');
        values.push(Array.isArray(updates.equipments) ? updates.equipments.join(',') : updates.equipments);
    }

    if (fields.length === 0) return c.json({ message: 'No changes' });

    values.push(id);
    const query = `UPDATE studios SET ${fields.join(', ')} WHERE id = ?`;

    try {
        await c.env.DB.prepare(query).bind(...values).run();
        return c.json({ message: 'Studio updated successfully' });
    } catch (e) {
        return c.json({ error: 'Update failed', details: e.message }, 500);
    }
});

// Delete Studio (Protected)
app.delete('/api/items/:id', authMiddleware, async (c) => {
    const id = c.req.param('id');
    const user = c.get('user');

    const studio = await c.env.DB.prepare('SELECT created_by FROM studios WHERE id = ?').bind(id).first();
    if (!studio) {
        return c.json({ error: 'Studio not found' }, 404);
    }
    if (studio.created_by !== user.id && user.role !== 'admin') {
        return c.json({ error: 'Unauthorized' }, 403);
    }

    try {
        await c.env.DB.prepare('DELETE FROM studios WHERE id = ?').bind(id).run();
        return c.json({ message: 'Studio deleted successfully' });
    } catch (e) {
        return c.json({ error: 'Delete failed', details: e.message }, 500);
    }
});

// --- Favorites API ---

// Add to Favorites
app.post('/api/favorites/:itemId', authMiddleware, async (c) => {
    const itemId = c.req.param('itemId');
    const user = c.get('user');

    // Check if studio exists (optional, enforced by FK but good for error message)
    const studio = await c.env.DB.prepare('SELECT id FROM studios WHERE id = ?').bind(itemId).first();
    if (!studio) {
        return c.json({ error: 'Studio not found' }, 404);
    }

    try {
        await c.env.DB.prepare('INSERT INTO favorites (user_id, studio_id) VALUES (?, ?)').bind(user.id, itemId).run();
        return c.json({ message: 'Added to favorites' });
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ message: 'Already in favorites' }); // Idempotent success-ish
        }
        return c.json({ error: 'Failed to add favorite', details: e.message }, 500);
    }
});

// Remove from Favorites
app.delete('/api/favorites/:itemId', authMiddleware, async (c) => {
    const itemId = c.req.param('itemId');
    const user = c.get('user');

    try {
        await c.env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND studio_id = ?').bind(user.id, itemId).run();
        return c.json({ message: 'Removed from favorites' });
    } catch (e) {
        return c.json({ error: 'Failed to remove favorite', details: e.message }, 500);
    }
});

// List My Favorites
app.get('/api/favorites/my-favorites', authMiddleware, async (c) => {
    const user = c.get('user');

    try {
        // Join with studios to get full details
        const { results } = await c.env.DB.prepare(`
            SELECT s.* 
            FROM studios s
            JOIN favorites f ON s.id = f.studio_id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `).bind(user.id).all();

        return c.json(results);
    } catch (e) {
        return c.json({ error: 'Failed to fetch favorites', details: e.message }, 500);
    }
});

// ========================================
// Bookings API
// ========================================

// Create Booking
app.post('/api/bookings', authMiddleware, async (c) => {
    const { itemId, date } = await c.req.json();
    const user = c.get('user');

    if (!itemId || !date) {
        return c.json({ error: 'Studio ID and date are required' }, 400);
    }

    try {
        // Check availability
        const existing = await c.env.DB.prepare(
            'SELECT id FROM bookings WHERE item_id = ? AND date = ? AND status != "cancelled"'
        ).bind(itemId, date).first();

        if (existing) {
            return c.json({ error: 'Date already booked' }, 409);
        }

        const result = await c.env.DB.prepare(
            'INSERT INTO bookings (user_id, item_id, date, status) VALUES (?, ?, ?, ?)'
        ).bind(user.id, itemId, date, 'confirmed').run();

        return c.json({ message: 'Booking confirmed', id: result.meta.last_row_id }, 201);
    } catch (error) {
        return c.json({ error: 'Failed to create booking' }, 500);
    }
});

// List User Bookings
app.get('/api/bookings/my-bookings', authMiddleware, async (c) => {
    const user = c.get('user');
    try {
        const bookings = await c.env.DB.prepare(`
            SELECT b.*, s.name as studio_name, s.price_per_hour, s.city, s.equipments
            FROM bookings b
            JOIN studios s ON b.item_id = s.id
            WHERE b.user_id = ?
            ORDER BY b.date DESC
        `).bind(user.id).all();
        return c.json(bookings.results);
    } catch (error) {
        return c.json({ error: 'Failed to fetch bookings' }, 500);
    }
});

// Get Studio Bookings (for availability check)
app.get('/api/items/:id/bookings', async (c) => {
    const itemId = c.req.param('id');
    try {
        const bookings = await c.env.DB.prepare(
            'SELECT date FROM bookings WHERE item_id = ? AND status != "cancelled"'
        ).bind(itemId).all();
        return c.json(bookings.results);
    } catch (error) {
        return c.json({ error: 'Failed to fetch availability' }, 500);
    }
});

// ========================================
// Reviews API
// ========================================

// Add Review
app.post('/api/items/:id/reviews', authMiddleware, async (c) => {
    const studioId = c.req.param('id');
    const { rating, comment } = await c.req.json();
    const user = c.get('user');

    if (!rating || rating < 1 || rating > 5) {
        return c.json({ error: 'Valid rating (1-5) is required' }, 400);
    }

    try {
        await c.env.DB.prepare(
            'INSERT INTO reviews (user_id, studio_id, rating, comment) VALUES (?, ?, ?, ?)'
        ).bind(user.id, studioId, rating, comment).run();

        return c.json({ message: 'Review added' }, 201);
    } catch (error) {
        return c.json({ error: 'Failed to add review' }, 500);
    }
});

// Get Reviews
app.get('/api/items/:id/reviews', async (c) => {
    const studioId = c.req.param('id');
    try {
        const reviews = await c.env.DB.prepare(`
            SELECT r.*, u.username 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.studio_id = ? 
            ORDER BY r.created_at DESC
        `).bind(studioId).all();
        return c.json(reviews.results);
    } catch (error) {
        return c.json({ error: 'Failed to fetch reviews' }, 500);
    }
});

// Serve static files
app.get('/css/*', serveStatic({ manifest }))
app.get('/js/*', serveStatic({ manifest }))
app.get('/assets/*', serveStatic({ manifest }))
app.get('/favicon.ico', serveStatic({ manifest }))

// Serve HTML files
app.get('/', serveStatic({ path: 'index.html', manifest }))
app.get('/index.html', serveStatic({ path: 'index.html', manifest }))
app.get('/studios.html', serveStatic({ path: 'studios.html', manifest }))
app.get('/studio-detail.html', serveStatic({ path: 'studio-detail.html', manifest }))
app.get('/login.html', serveStatic({ path: 'login.html', manifest }))
app.get('/register.html', serveStatic({ path: 'register.html', manifest }))
app.get('/favorites.html', serveStatic({ path: 'favorites.html', manifest }))
app.get('/add-studio.html', serveStatic({ path: 'add-studio.html', manifest }))
app.get('/my-bookings.html', serveStatic({ path: 'my-bookings.html', manifest }))

export default app
