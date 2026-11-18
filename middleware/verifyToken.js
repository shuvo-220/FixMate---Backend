let JWKS;

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Token is missing!",
      });
    }

    const token = authHeader.split(" ")[1];

    const baseURL = process.env.BETTER_AUTH_URL;

    if (!baseURL) {
      throw new Error("BETTER_AUTH_URL is missing!");
    }

    const { jwtVerify, createRemoteJWKSet } =
      await import("jose");

    if (!JWKS) {
      JWKS = createRemoteJWKSet(
        new URL("/api/auth/jwks", baseURL)
      );
    }
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: baseURL,
      audience: baseURL,
    });

    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      role: payload.role,
    };

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
