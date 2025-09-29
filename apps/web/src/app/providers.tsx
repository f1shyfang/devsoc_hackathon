"use client"
import { SessionProvider } from "next-auth/react"
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from "@apollo/client"
import { ReactNode } from "react"

const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:4000/graphql" }),
  cache: new InMemoryCache()
})

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </SessionProvider>
  )
}


