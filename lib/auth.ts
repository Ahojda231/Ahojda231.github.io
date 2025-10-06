import type { NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import * as bcrypt from 'bcryptjs';
import { getAccountByUsername } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;
        const account = await getAccountByUsername(credentials.username);
        if (!account) return null;

        // Normalize PHP bcrypt prefix $2y$ -> $2b$ for Node compare
        const storedHash = (account.password || '').replace(/^\$2y\$/i, '$2b$');
        const ok = await bcrypt.compare(credentials.password, storedHash);
        if (!ok) return null;

        return {
          id: String(account.id),
          name: account.username,
          email: account.email ?? undefined,
          image: account.avatar && account.avatar !== '0' ? account.avatar : undefined,
          // custom fields we will forward to JWT
          admin: account.admin,
          supporter: account.supporter,
          vct: account.vct,
          mapper: account.mapper,
          scripter: account.scripter,
          fmt: account.fmt,
        } as any;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.name = user.name;
        token.email = user.email ?? undefined;
        // propagate avatar and roles
        token.image = (user as any).image ?? undefined;
        token.admin = (user as any).admin ?? 0;
        token.supporter = (user as any).supporter ?? 0;
        token.vct = (user as any).vct ?? 0;
        token.mapper = (user as any).mapper ?? 0;
        token.scripter = (user as any).scripter ?? 0;
        token.fmt = (user as any).fmt ?? 0;
      }
      return token as any;
    },
    async session({ session, token }) {
      if (token) {
        const s = session as any;
        s.id = token.id;
        s.user = s.user ?? {};
        s.user.name = token.name as string | undefined;
        s.user.email = token.email as string | undefined;
        s.user.image = (token as any).image as string | undefined;
        s.roles = {
          admin: (token as any).admin ?? 0,
          supporter: (token as any).supporter ?? 0,
          vct: (token as any).vct ?? 0,
          mapper: (token as any).mapper ?? 0,
          scripter: (token as any).scripter ?? 0,
          fmt: (token as any).fmt ?? 0,
        };
      }
      return session as any;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
