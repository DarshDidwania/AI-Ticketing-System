import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    console.log(`--- Auth Middleware Triggered for [${req.method}] ${req.path} ---`);
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        console.error("Auth Error: No 'Authorization' header found.");
        return res.status(401).json({ error: "Access denied. Authorization header missing." });
    }
    
    console.log("Auth Header Received:", authHeader); 

    const tokenParts = authHeader.split(" ");

    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        console.error("Auth Error: Header format is not 'Bearer <token>'.");
        return res.status(401).json({ error: "Invalid token format." });
    }

    const token = tokenParts[1];
    
    if (!token) {
        console.error("Auth Error: Token is missing after 'Bearer '.");
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log("Token decoded successfully for user:", req.user.email);
        next();
    } catch (error) {
        console.error("Auth Error: Invalid token.", error.message);
        res.status(401).json({ error: "Invalid token. Please log in again." });
    }
};
