
const express = require("express");
const pool = require("../config/db");

const {
    authenticateToken,
    requireRole,
} = require("../middleware/authMiddleware");

const router = express.Router();

// GET: Retrieve all published events
router.get("/", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                event_id, title, description, category, department,
                venue_name, start_time, end_time, total_capacity,
                activity_credits, status
            FROM events
            WHERE status = 'published'
            ORDER BY start_time ASC
        `);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            events: result.rows,
        });
    } catch (error) {
        console.error("Fetch events error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch events.",
        });
    }
});

// POST: Create a new event
router.post(
    "/",
    authenticateToken,
    requireRole("admin"),
    async (req, res) =>  {
    const {
        title, description, category, department, venue_name,
        start_time, end_time, total_capacity, activity_credits,
    } = req.body;

    if (
        typeof title !== "string" || !title.trim() ||
        typeof category !== "string" || !category.trim() ||
        typeof department !== "string" || !department.trim() ||
        typeof venue_name !== "string" || !venue_name.trim() ||
        !start_time || !end_time ||
        total_capacity === undefined || total_capacity === null
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide all required event fields.",
        });
    }

    const capacity = Number(total_capacity);
    if (!Number.isInteger(capacity) || capacity < 1) {
        return res.status(400).json({
            success: false,
            message: "Total capacity must be a positive integer.",
        });
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (
        Number.isNaN(startDate.getTime()) ||
        Number.isNaN(endDate.getTime()) ||
        endDate <= startDate
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid event dates. End time must be after start time.",
        });
    }

    const credits = activity_credits === undefined
        ? 0
        : Number(activity_credits);

    if (!Number.isFinite(credits) || credits < 0) {
        return res.status(400).json({
            success: false,
            message: "Activity credits must be a non-negative number.",
        });
    }

    if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Description must be a string.",
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO events (
                title, description, category, department, venue_name,
                start_time, end_time, total_capacity, activity_credits, status
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published')
            RETURNING
                event_id, title, description, category, department,
                venue_name, start_time, end_time, total_capacity,
                activity_credits, status`,
            [
                title.trim(),
                description?.trim() || null,
                category.trim(),
                department.trim(),
                venue_name.trim(),
                startDate.toISOString(),
                endDate.toISOString(),
                capacity,
                credits,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Event created successfully.",
            event: result.rows[0],
        });
    } catch (error) {
        console.error("Create event error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to create event.",
        });
    }
});

// PATCH: Update an existing published event
// Local testing only until faculty/admin authorization is implemented.
router.patch(
    "/:id",
    authenticateToken,
    requireRole("admin"),
    async (req, res) =>  {
    const eventId = req.params.id;

    if (!/^\d+$/.test(eventId) || Number(eventId) < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid event ID.",
        });
    }

    const allowedFields = [
        "title",
        "description",
        "category",
        "department",
        "venue_name",
        "start_time",
        "end_time",
        "total_capacity",
        "activity_credits",
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
        if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
            continue;
        }

        let value = req.body[field];

        if (field === "description" && value === null) {
            // Allow clearing the description.
        } else if (
            ["title", "category", "department", "venue_name"].includes(field)
        ) {
            if (typeof value !== "string" || !value.trim()) {
                return res.status(400).json({
                    success: false,
                    message: `${field} must be a non-empty string.`,
                });
            }
            value = value.trim();
        } else if (field === "description") {
            if (typeof value !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Description must be a string or null.",
                });
            }
            value = value.trim();
        } else if (field === "start_time" || field === "end_time") {
            if (typeof value !== "string" || !value.trim()) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ${field}.`,
                });
            }

            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ${field}.`,
                });
            }
            value = date.toISOString();
        } else if (field === "total_capacity") {
            value = Number(value);
            if (!Number.isInteger(value) || value < 1) {
                return res.status(400).json({
                    success: false,
                    message: "Total capacity must be a positive integer.",
                });
            }
        } else if (field === "activity_credits") {
            value = Number(value);
            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Activity credits must be non-negative.",
                });
            }
        }

        values.push(value);
        updates.push(`${field} = $${values.length}`);
    }

    if (updates.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one valid field to update.",
        });
    }

    try {
        const existing = await pool.query(
            `SELECT start_time, end_time
             FROM events
             WHERE event_id = $1 AND status = 'published'`,
            [eventId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Published event not found.",
            });
        }

        const current = existing.rows[0];
        const newStart = req.body.start_time !== undefined
            ? new Date(req.body.start_time)
            : new Date(current.start_time);
        const newEnd = req.body.end_time !== undefined
            ? new Date(req.body.end_time)
            : new Date(current.end_time);

        if (newEnd <= newStart) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time.",
            });
        }

        values.push(eventId);

        const result = await pool.query(
            `UPDATE events
             SET ${updates.join(", ")}
             WHERE event_id = $${values.length}
               AND status = 'published'
             RETURNING
                event_id, title, description, category, department,
                venue_name, start_time, end_time, total_capacity,
                activity_credits, status`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Published event not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            event: result.rows[0],
        });
    } catch (error) {
        console.error("Update event error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to update event.",
        });
    }
});

// GET: Retrieve one published event by ID
router.get("/:id", async (req, res) => {
    const eventId = req.params.id;

    if (!/^\d+$/.test(eventId) || Number(eventId) < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid event ID.",
        });
    }

    try {
        const result = await pool.query(
            `SELECT
                event_id, title, description, category, department,
                venue_name, start_time, end_time, total_capacity,
                activity_credits, status
             FROM events
             WHERE event_id = $1 AND status = 'published'`,
            [eventId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Published event not found.",
            });
        }

        return res.status(200).json({
            success: true,
            event: result.rows[0],
        });
    } catch (error) {
        console.error("Fetch event by ID error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch event.",
        });
    }
});

/* PATCH: Cancel a published event
   Local testing only until faculty/admin authorization is added. */
router.patch(
    "/:id/cancel",
    authenticateToken,
    requireRole("admin"),
    async (req, res) => {
    const eventId = req.params.id;

    if (!/^\d+$/.test(eventId) || Number(eventId) < 1) {
        return res.status(400).json({
            success: false,
            message: "Invalid event ID.",
        });
    }

    try {
        const result = await pool.query(
            `UPDATE events
             SET status = 'cancelled'
             WHERE event_id = $1
               AND status = 'published'
             RETURNING
                event_id,
                title,
                description,
                category,
                department,
                venue_name,
                start_time,
                end_time,
                total_capacity,
                activity_credits,
                status`,
            [eventId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Published event not found or already cancelled.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Event cancelled successfully.",
            event: result.rows[0],
        });
    } catch (error) {
        console.error("Cancel event error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to cancel event.",
        });
    }
});