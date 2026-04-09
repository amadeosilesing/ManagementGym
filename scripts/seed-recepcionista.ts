import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { usuarios } from '../lib/db/schema'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const db = drizzle(pool)

async function main() {
  const hash = await bcrypt.hash('recep123', 12)

  await db.insert(usuarios).values({
    nombre:       'Recepcionista',
    email:        'recep@gimnasio.com',
    passwordHash: hash,
    rol:          'recepcionista',
  })

  console.log('✅ Recepcionista creado correctamente')
  await pool.end()
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})