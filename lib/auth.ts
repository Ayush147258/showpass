import NextAuth from "next-auth";
import type {} from "next-auth/jwt";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        // Demo accounts for hackathon
        const demoAccounts: Record<string, { role: UserRole; name: string }> = {
          "organiser@showpass.demo": { role: "ORGANISER", name: "Arjun Mehta" },
          "attendee@showpass.demo": { role: "ATTENDEE", name: "Priya Sharma" },
          "admin@showpass.demo": { role: "ADMIN", name: "Admin User" },
        };
        const demo = demoAccounts[credentials.email as string];
        if (demo && credentials.password === "password123") {
          let user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email as string,
                name: demo.name,
                role: demo.role,
                isVerified: true,
              },
            });
          }
          return user;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as UserRole;
        session.user.isVerified = Boolean(token.isVerified);
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as typeof user & { role?: UserRole }).role;
        token.isVerified = (user as typeof user & { isVerified?: boolean }).isVerified ?? false;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: { strategy: "jwt" },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      isVerified: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    isVerified?: boolean;
  }
}
