import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/queries";

// Google sign-in is optional: the provider only loads when the OAuth credentials
// are present, so the app runs in email/nickname mode until you add them.
export const googleEnabled = !!process.env.AUTH_GOOGLE_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(googleEnabled ? [Google] : []),
    // Email/password. authorize() runs server-side (Node) and never trusts the
    // client: it looks up the account and bcrypt-compares the password.
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await getUserByEmail(email).catch(() => null);
        if (!user) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  session: { strategy: "jwt" },
  trustHost: true, // needed for non-Vercel / self-hosted deploys
  callbacks: {
    // Record which provider signed the user in so routes can key the leaderboard
    // identity correctly ("google:<email>" vs "email:<email>").
    jwt({ token, account }) {
      if (account) token.provider = account.provider;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.provider = token.provider;
      return session;
    },
  },
});
