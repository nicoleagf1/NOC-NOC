import { query } from './src/lib/db.js';
async function main() {
  try {
    const res = await query('SELECT username, is_active, must_change_password FROM users');
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
main();
