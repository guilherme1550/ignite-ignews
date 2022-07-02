import { query as q } from 'faunadb'
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { getSession } from 'next-auth/react'
import { fauna } from '../../../services/fauna'


export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      // authorization: {
      //   params: {
      //     scope: 'read:user',
      //   },
      // },
    }),
    // ...add more providers here
  ],
  secret: process.env.SECRET,
  callbacks: {
    async session({ session }) {
      try {
        const userActiveSubscription = await fauna.query(
          q.Get( 
            q.Intersection([  
              q.Match(
                q.Index('subscription_by_user_ref'),
                q.Select(
                  'ref',
                  q.Get(
                    q.Match(
                      q.Index('user_by_email'),
                      q.Casefold(session.user.email)
                    )
                  )
                )
              ),
              q.Match(
                q.Index('subscription_by_status'),
                'active'
              )
            ])
          )
        )
        return {
          ...session,
          activeSubscription: userActiveSubscription
        }
      } catch (error) {
        return {
          ...session,
          activeSubscription: null
        }
      }
    },
    async signIn({ user, account, profile, email, credentials }) {
      try {
        await fauna.query(
          q.If(
            q.Not( // Condition
              q.Exists(
                q.Match(
                  q.Index( 'user_by_email'),
                  q.Casefold(user.email) // Casefold = Lowercase
                )
              )
            ),
            q.Create( // True
              q.Collection('users'),
              {
                data: {
                  email: user.email
                }
              }
            ),
            q.Get( // False
              q.Match(
                q.Index('user_by_email'),
                q.Casefold(user.email)
              )
            )
          )
        )
        return true;
      } catch {
        return false;
      }
    }
  }
  
})