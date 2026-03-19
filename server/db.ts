import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database;

// Fake pool to mimic mysql2/promise API
export const pool = {
  query: async <T = any>(sql: string, params: any[] = []): Promise<[T, any]> => {
    if (!db) throw new Error("Database not initialized");
    
    // SQLite uses ? for params, just like mysql2.
    // better-sqlite3 requires null instead of undefined
    const safeParams = params.map(p => p === undefined ? null : p);
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    
    if (isSelect) {
      const stmt = db.prepare(sql);
      const rows = stmt.all(...safeParams);
      return [rows as unknown as T, []];
    } else {
      const stmt = db.prepare(sql);
      const result = stmt.run(...safeParams);
      // To mimic mysql2 insertId
      return [{ insertId: result.lastInsertRowid, affectedRows: result.changes } as unknown as T, []];
    }
  },
  getConnection: async () => {
    return {
      release: () => {}
    };
  }
};

export async function testConnection() {
  try {
    db = new Database(':memory:');
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Load schema
    const schemaPath = path.join(process.cwd(), 'server', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Clean up schema for SQLite compatibility
    const sqliteSchema = schemaSql
      .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
      .replace(/ON UPDATE CURRENT_TIMESTAMP/g, '')
      .replace(/ENUM\([^)]+\)/g, 'VARCHAR(50)')
      .replace(/JSON/g, 'TEXT');
      
    db.exec(sqliteSchema);
    
    console.log('✅ Conexión a SQLite en memoria establecida y esquema cargado.');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a SQLite:', error);
    return false;
  }
}
