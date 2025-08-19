import { Hono } from 'hono'
import { agent } from '../../src/agent'

const app = new Hono()

app.post('/', async (c) => {
  const { message } = await c.req.json()
  const reply = await agent.run(message)
  return c.json({ reply })
})

export default app
