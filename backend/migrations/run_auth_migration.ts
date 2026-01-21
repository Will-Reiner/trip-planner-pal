import bcrypt from 'bcrypt';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const runMigration = async () => {
  const client = new Client({
    host: 'localhost',
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'trip_planner',
  });

  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados');

    // Gerar hash da senha
    const password = 'ultramegasuperpassword123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✓ Hash da senha gerado');

    // Ler arquivo SQL
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'add_auth_system.sql'),
      'utf-8'
    );

    // Substituir o placeholder pelo hash real
    const sqlWithHash = sqlFile.replace(
      '$2b$10$YourHashedPasswordWillGoHere',
      hashedPassword
    );

    // Executar migration
    await client.query(sqlWithHash);
    console.log('✓ Migration executada com sucesso');
    console.log('');
    console.log('Usuário admin criado:');
    console.log('  Nome: Will');
    console.log('  Senha: ultramegasuperpassword123');
    console.log('  Role: admin');

  } catch (error) {
    console.error('❌ Erro na migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

runMigration();
