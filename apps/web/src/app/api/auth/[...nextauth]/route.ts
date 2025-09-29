import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@devsoc/db"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" }
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined
        if (!email) return null
        const user = await prisma.user.upsert({
          where: { email },
          update: {},
          create: { email }
        })
        return { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined }
      }
    })
  ],
  session: { strategy: "database" }
} satisfies Parameters<typeof NextAuth>[0]

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }


