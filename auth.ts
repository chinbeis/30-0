import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Google sign-in is optional: the provider only loads when the OAuth credentials
// are present, so the app runs in nickname-only mode until you add them.
export const googleEnabled = !!process.env.AUTH_GOOGLE_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: googleEnabled ? [Google] : [],
  session: { strategy: "jwt" },
  trustHost: true, // needed for non-Vercel / self-hosted deploys
});
