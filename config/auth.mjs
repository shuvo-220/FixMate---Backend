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
          required: true,
        },
        area: {
          type: "string",
          required: true,
        },
        bio: {
          type: "string",
          required: false,
        },
      },
    },

    plugins: [
      jwt({
        jwt: {
          definePayload: ({ user }) => ({
            id: user.id,
            email: user.email,
            role: user.role,
          }),
        },
      }),
    ],
  });
};
