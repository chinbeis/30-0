import "next-auth";
import "next-auth/jwt";

// Augment the session/JWT to carry which provider authenticated the user.
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      provider?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    provider?: string;
  }
}
