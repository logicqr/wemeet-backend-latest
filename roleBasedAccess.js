const jwt = require('jsonwebtoken')

function roleBasedAccess(requireRoles) {
    return async (req, res, next) => {
        const data = req.headers["authorization"]
        const token = data && data.split(' ')[1]
        if (!token) {
            return res.status(401).json({ message: "Token Not Found" });
        }
        jwt.verify(token, 'jaromjery', (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Token Invalid", error: err.message });
            }

            console.log(decoded.role);
            console.log(requireRoles);

            // Check if the user's role is in the allowed roles array
            if (requireRoles && !requireRoles.includes(decoded.role)) {
                return res.status(403).json({ message: "Access Denied: Insufficient Permissions" });
            }

            // Attach user information to request object
            req.user = decoded;
            console.log("khjk", req.user)
            next();
        });
    };

}

module.exports=roleBasedAccess