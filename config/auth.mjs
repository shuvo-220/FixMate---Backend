import mongoose from "mongoose";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";
import {
  createAuthMiddleware,
  APIError,
} from "better-auth/api";

export const createAuth = () => {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB is not connected!");
  }

  return betterAuth({
    database: mongodbAdapter(db, {
      client: mongoose.connection.getClient(),
    }),

    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,

    trustedOrigins: [
      process.env.CLIENT_URL || "http://localhost:3000",
    ],

    // Email and Password Authentication
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      minPasswordLength: 6,
      maxPasswordLength: 128,
    },

    // User Additional Fields
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "customer",
          input: false,
        },

        phone: {
          type: "string",
          required: false,
        },

        area: {
          type: "string",
          required: false,
        },

        bio: {
          type: "string",
          required: false,
        },
      },
    },

    // Signup Validation
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") {
          return;
        }

        const { name, email, password } = ctx.body || {};

        // Required Fields Validation
        if (
          typeof name !== "string" ||
          !name.trim() ||
          typeof email !== "string" ||
          !email.trim() ||
          typeof password !== "string"
        ) {
          throw new APIError("BAD_REQUEST", {
            message: "Name, email and password are required!",
          });
        }

        // Email Format Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email.trim())) {
          throw new APIError("BAD_REQUEST", {
            message: "Please provide a valid email address!",
          });
        }

        // Minimum Password Length
        if (password.length < 6) {
          throw new APIError("BAD_REQUEST", {
            message: "Password must be at least 6 characters long!",
          });
        }

        // Maximum Password Length
        if (password.length > 128) {
          throw new APIError("BAD_REQUEST", {
            message: "Password cannot exceed 128 characters!",
          });
        }

        // Uppercase Validation
        if (!/[A-Z]/.test(password)) {
          throw new APIError("BAD_REQUEST", {
            message: "Password must contain at least one uppercase letter!",
          });
        }

        // Lowercase Validation
        if (!/[a-z]/.test(password)) {
          throw new APIError("BAD_REQUEST", {
            message: "Password must contain at least one lowercase letter!",
          });
        }
      }),
    },

    // Secure User Role Validation
    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            const requestedRole = ctx?.body?.role;

            const allowedRoles = [
              "customer",
              "technician",
            ];

            const safeRole = allowedRoles.includes(requestedRole)
              ? requestedRole
              : "customer";

            return {
              data: {
                ...user,
                role: safeRole,
              },
            };
          },
        },
      },
    },

    // JWT Plugin
    plugins: [
      jwt({
        jwt: {
          definePayload: ({ user }) => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }),
        },
      }),
    ],
  });
};
