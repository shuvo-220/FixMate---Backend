import mongoose from "mongoose";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { jwt } from "better-auth/plugins";

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

    emailAndPassword: {
      enabled: true,
    },

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

    databaseHooks: {
      user: {
        create: {
          before: async (user, ctx) => {
            const requestedRole = ctx?.body?.role;

            const allowedRoles = ["customer", "technician"];

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
