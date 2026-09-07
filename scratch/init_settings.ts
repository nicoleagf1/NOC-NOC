import { query } from '../src/lib/db';

async function main() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Insert default value if not exists
    await query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('public_utilities_enabled', 'true', 'Enable public access to utilidades-mini')
      ON CONFLICT (key) DO NOTHING;
    `);
    
    console.log("Settings table initialized.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

main();
