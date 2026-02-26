const express = require('express');
const router = express.Router();
const { PrismaClient } = require('../../prisma/generated/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// ==== AUTH ROUTES ====
// POST /api/auth/register (Crea usuario y Space si es el primero)
router.post('/auth/register', async (req, res) => {
    try {
        const { name, email, password, inviteCode } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'El email ya está en uso' });

        const hashedPassword = await bcrypt.hash(password, 10);

        let spaceIdToUse;
        if (inviteCode) {
            // Join existing space using inviteCode (which is the spaceId for simplicity)
            const space = await prisma.space.findUnique({ where: { id: inviteCode } });
            if (!space) return res.status(404).json({ message: 'Código de invitación inválido' });
            spaceIdToUse = space.id;
        } else {
            // Create new space
            const newSpace = await prisma.space.create({ data: { name: `Cosas de ${name}` } });
            spaceIdToUse = newSpace.id;
        }

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                spaceId: spaceIdToUse
            }
        });

        const token = jwt.sign({ userId: user.id, spaceId: user.spaceId }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({ token, user: { id: user.id, name: user.name, spaceId: user.spaceId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// POST /api/auth/login (Devuelve JWT)
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Credenciales inválidas' });

        const token = jwt.sign({ userId: user.id, spaceId: user.spaceId }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, name: user.name, spaceId: user.spaceId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// GET /api/spaces/invite (Genera código de unión)
router.get('/spaces/invite', authMiddleware, async (req, res) => {
    // Para la MVP, el código de invitación es el mismo ID del espacio
    res.json({ inviteCode: req.user.spaceId });
});

// ==== HELPER FUNCTION FOR OVERLAPS ====
async function checkOverlap(prisma, spaceId, newStart, newEnd, excludeEventId = null) {
    // If no end time is provided, assume 1 hour duration for overlap purposes
    const end = newEnd ? new Date(newEnd) : new Date(new Date(newStart).getTime() + 60 * 60 * 1000);
    const start = new Date(newStart);

    const overlappingEvents = await prisma.event.findMany({
        where: {
            spaceId: spaceId,
            ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
            AND: [
                {
                    dateStart: { lt: end }
                }
            ]
        }
    });

    // Since dateEnd can be null in the DB, we filter them in code to be precise
    // An overlap occurs when: StartA < EndB AND EndA > StartB
    return overlappingEvents.some(ev => {
        const evStart = new Date(ev.dateStart);
        const evEnd = ev.dateEnd ? new Date(ev.dateEnd) : new Date(evStart.getTime() + 60 * 60 * 1000);
        return start < evEnd && end > evStart;
    });
}

// ==== EVENTS ROUTES ====
// GET /api/events
router.get('/events', authMiddleware, async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            where: { spaceId: req.user.spaceId },
            include: { creator: { select: { name: true } } },
            orderBy: { dateStart: 'asc' }
        });
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// POST /api/events
router.post('/events', authMiddleware, async (req, res) => {
    try {
        const { title, dateStart, dateEnd } = req.body;

        // Detect overlap
        const hasOverlap = await checkOverlap(prisma, req.user.spaceId, dateStart, dateEnd);
        if (hasOverlap) {
            return res.status(409).json({ message: 'El evento se superpone con otra actividad programada.' });
        }

        const event = await prisma.event.create({
            data: {
                title,
                dateStart: new Date(dateStart),
                dateEnd: dateEnd ? new Date(dateEnd) : null,
                spaceId: req.user.spaceId,
                createdBy: req.user.userId
            },
            include: { creator: { select: { name: true } } }
        });
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// PUT /api/events/:id
router.put('/events/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, dateStart, dateEnd } = req.body;

        // Verificamos que el evento pertenezca al espacio del usuario
        const existing = await prisma.event.findFirst({ where: { id, spaceId: req.user.spaceId } });
        if (!existing) return res.status(404).json({ message: 'Evento no encontrado' });

        const effectiveStart = dateStart || existing.dateStart;
        const effectiveEnd = dateEnd !== undefined ? dateEnd : existing.dateEnd;

        // Detect overlap
        const hasOverlap = await checkOverlap(prisma, req.user.spaceId, effectiveStart, effectiveEnd, id);
        if (hasOverlap) {
            return res.status(409).json({ message: 'El evento se superpone con otra actividad programada.' });
        }

        const event = await prisma.event.update({
            where: { id },
            data: {
                title: title || existing.title,
                dateStart: dateStart ? new Date(dateStart) : existing.dateStart,
                dateEnd: dateEnd !== undefined ? (dateEnd ? new Date(dateEnd) : null) : existing.dateEnd
            },
            include: { creator: { select: { name: true } } }
        });
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// DELETE /api/events/:id
router.delete('/events/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.event.findFirst({ where: { id, spaceId: req.user.spaceId } });
        if (!existing) return res.status(404).json({ message: 'Evento no encontrado' });

        await prisma.event.delete({ where: { id } });
        res.json({ message: 'Evento eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});


// ==== LIST ITEMS ROUTES ====
// GET /api/items
router.get('/items', authMiddleware, async (req, res) => {
    try {
        const items = await prisma.listItem.findMany({
            where: { spaceId: req.user.spaceId },
            orderBy: { id: 'asc' } // Podría ordenarse por fecha si existiera
        });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// POST /api/items
router.post('/items', authMiddleware, async (req, res) => {
    try {
        const { content } = req.body;
        const item = await prisma.listItem.create({
            data: {
                content,
                spaceId: req.user.spaceId
            }
        });
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// PUT /api/items/:id (Toggle isCompleted)
router.put('/items/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.listItem.findFirst({ where: { id, spaceId: req.user.spaceId } });
        if (!existing) return res.status(404).json({ message: 'Ítem no encontrado' });

        const item = await prisma.listItem.update({
            where: { id },
            data: { isCompleted: !existing.isCompleted } // Hacemos toggle
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// DELETE /api/items/completed (Borra los tachados)
router.delete('/items/completed', authMiddleware, async (req, res) => {
    try {
        await prisma.listItem.deleteMany({
            where: {
                spaceId: req.user.spaceId,
                isCompleted: true
            }
        });
        res.json({ message: 'Ítems completados eliminados' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// DELETE /api/items/:id (Borrado individual, útil adicional MVP)
router.delete('/items/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const existing = await prisma.listItem.findFirst({ where: { id, spaceId: req.user.spaceId } });
        if (!existing) return res.status(404).json({ message: 'Ítem no encontrado' });

        await prisma.listItem.delete({ where: { id } });
        res.json({ message: 'Ítem eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

module.exports = router;
