import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { ApolloServer, gql } from 'apollo-server-express'

const typeDefs = gql`
  type Query {
    hello: String
  }
`

const resolvers = {
  Query: {
    hello: () => 'Hello from Apollo Server!'
  }
}

async function start() {
  const app = express()
  app.use(cors())

  const server = new ApolloServer({ typeDefs, resolvers })
  await server.start()
  server.applyMiddleware({ app, path: '/graphql' })

  const port = process.env.PORT ? Number(process.env.PORT) : 4000
  app.get('/health', (_req, res) => res.json({ ok: true }))
  app.listen(port, () => {
    console.log(`Server ready at http://localhost:${port}${server.graphqlPath}`)
  })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
