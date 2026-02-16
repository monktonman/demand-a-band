import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          onboarded: user.onboarded,
          emailVerified: user.emailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.onboarded = user.onboarded;
        token.emailVerified = !!user.emailVerified;
        token.lastVerified = Date.now();
      }

      // Handle session updates (e.g., after onboarding or profile changes)
      if (trigger === "update" && session) {
        if (session.onboarded !== undefined) {
          token.onboarded = session.onboarded;
        }
        if (session.role !== undefined) {
          token.role = session.role;
        }
        if (session.name !== undefined) {
          token.name = session.name;
        }
        if (session.emailVerified !== undefined) {
          token.emailVerified = session.emailVerified;
        }
      }

      // Re-validate against database periodically (every 5 minutes)
      // This catches deleted users, role changes, and re-created accounts
      const lastVerified = (token.lastVerified as number) || 0;
      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - lastVerified > fiveMinutes) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { id: true, role: true, onboarded: true, email: true, name: true, emailVerified: true },
          });

          if (!dbUser) {
            // User was deleted — invalidate the token
            token.invalidated = true;
            return token;
          }

          // Sync token with current database state
          token.role = dbUser.role;
          token.onboarded = dbUser.onboarded;
          token.emailVerified = !!dbUser.emailVerified;
          token.name = dbUser.name;
          token.lastVerified = Date.now();
        } catch {
          // If DB check fails, keep existing token (don't break sessions)
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        // If token was invalidated (user deleted), clear the session
        if (token.invalidated) {
          session.user.id = "";
          session.user.role = "FAN";
          session.user.onboarded = false;
          return session;
        }

        session.user.id = token.id;
        session.user.role = token.role;
        session.user.onboarded = token.onboarded;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
};
