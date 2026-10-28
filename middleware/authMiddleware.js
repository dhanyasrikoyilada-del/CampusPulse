
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const [scheme, token] = authHeader?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            success: false,
            message: "Authentication token is required.",
        });
    }

    if (!process.env.JWT_SECRET) {
        console.error("JWT_SECRET is not configured");

        return res.status(500).json({
            success: false,
            message: "Server configuration error.",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (
            typeof decoded !== "object" ||
            !decoded.sub ||
            !["student", "admin"].includes(decoded.role)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token.",
            });
        }

        req.user = {
            user_id: decoded.sub,
            role: decoded.role,
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token.",
        });
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You do not have permission to perform this action.",
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole,
};
