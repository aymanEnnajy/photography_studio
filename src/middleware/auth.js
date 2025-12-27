import { verify } from 'jsonwebtoken'

export const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized: Missing or invalid token' }, 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = verify(token, c.env.JWT_SECRET);
        c.set('user', payload); // Store user info in context
        await next();
    } catch (error) {
        return c.json({ error: 'Unauthorized: Invalid token' }, 401);
    }
}
