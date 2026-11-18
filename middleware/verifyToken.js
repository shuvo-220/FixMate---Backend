
let JWKS;

const verifyToken = async (req, res, next) => {
  try {
    // 1. Get Authorization Header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token is missing!",
      });
    }

    // 2. Extract JWT Token
    const token = authHeader.split(" ")[1];

    const baseURL = process.env.BETTER_AUTH_URL;

    if (!baseURL) {
      throw new Error("BETTER_AUTH_URL is missing!");
    }

    // 3. Import JOSE
    const { jwtVerify, createRemoteJWKSet } = await import("jose");

    // 4. Create JWKS
    if (!JWKS) {
      JWKS = createRemoteJWKSet(
        new URL("/api/auth/jwks", baseURL)
      );
    }

    // 5. Verify JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: baseURL,
      audience: baseURL,
    });

    // 6. Debug JWT Payload
    console.log("========== JWT PAYLOAD ==========");

    console.log({
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    });

    console.log("=================================");

    // 7. Store User Information
    req.user = {
      id: payload.id || payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
    };

    // 8. Check Required User Information
    if (!req.user.id || !req.user.email || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "User information is missing from JWT!",
      });
    }

    // 9. Continue
    next();

  } catch (error) {
    console.error("JWT verification failed:", error.message);

    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid or expired token!",
    });
  }
};

module.exports = verifyToken;
