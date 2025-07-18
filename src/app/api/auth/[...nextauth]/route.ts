import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow netnode.ch email addresses
      if (user.email?.endsWith('@netnode.ch')) {
        return true
      }
      return false
    },
    async session({ session, token }) {
      // Add user info to session
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/error',
  },
})

export { handler as GET, handler as POST }