import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Configuración del pool de conexiones para MariaDB
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'docente_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Permite ejecutar múltiples declaraciones en una sola consulta (útil para cargar el schema inicial)
  multipleStatements: true
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MariaDB establecida correctamente.');
    
    // Opcional: Cargar el esquema si la base de datos está vacía
    // (En producción, es mejor ejecutar el schema.sql manualmente)
    const [tables] = await connection.query("SHOW TABLES LIKE 'users'");
    if ((tables as any[]).length === 0) {
      console.log('⚠️ Base de datos vacía. Cargando esquema inicial...');
      const schemaPath = path.join(process.cwd(), 'server', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schemaSql);
        console.log('✅ Esquema inicial cargado correctamente.');
      }
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MariaDB:', error);
    return false;
  }
}
