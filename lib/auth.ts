import NextAuth, { DefaultSession } from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import GitHub from "next-auth/providers/github"
import { db } from "@/lib/db"
import { accounts } from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    user: {
      id: string
    } & DefaultSession["user"]
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          scope: "repo user:email read:project",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (user) {
        session.user.id = user.id
        
        // Fetch the GitHub account to get access token
        const account = await db.query.accounts.findFirst({
          where: and(
            eq(accounts.userId, user.id),
            eq(accounts.provider, "github")
          ),
        })
        
        if (account?.access_token) {
          session.accessToken = account.access_token
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
})
