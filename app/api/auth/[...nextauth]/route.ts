import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID as string,
      clientSecret: process.env.GOOGLE_SECRET as string,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});

// Fix for Next.js 15+: await params before passing to next-auth
export async function GET(req: any, context: any) {
  const params = await context.params;
  return handler(req, { ...context, params });
}

export async function POST(req: any, context: any) {
  const params = await context.params;
  return handler(req, { ...context, params });
}
