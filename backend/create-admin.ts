import bcrypt from 'bcrypt';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const createAdmin = async () => {
  const dbHost = process.env.DB_HOST ?? 'localhost';
  const dbPort = process.env.DB_PORT ?? '5433';
  const dbUser = process.env.DB_USER ?? 'postgres';
  const dbPassword = process.env.DB_PASSWORD ?? 'postgres';
  const dbName = process.env.DB_NAME ?? 'trip_planner';

  const connectionString =
    process.env.DATABASE_URL ??
    `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    
    const password = 'ultramegasuperpassword123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const checkUser = await client.query(
      "SELECT id FROM users WHERE nome = 'Will'"
    );

    if (checkUser.rows.length > 0) {
      await client.query(
        "UPDATE users SET senha = $1, role = 'admin' WHERE nome = 'Will'",
        [hashedPassword]
      );
      console.log('✓ Admin Will atualizado');
    } else {
      await client.query(
        `INSERT INTO users (nome, senha, role, titulo_engracado) 
         VALUES ('Will', $1, 'admin', 'O Mestre da Viagem')`,
        [hashedPassword]
      );
      console.log('✓ Admin Will criado');
    }

    console.log('');
    console.log('✓ Setup concluido!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

createAdmin();
