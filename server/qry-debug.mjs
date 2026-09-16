import { query } from './config/database.js';
const res = await query(`SELECT s.id, s.ai_model, s.status, s.summary_length, s.tokens_used, s.processing_time_ms, s.original_filename, s.original_file_type FROM ai_summaries s WHERE s.id = 24`);
console.log(JSON.stringify(res.rows, null, 2));
const res2 = await query(`SELECT summary_text FROM ai_summaries WHERE id = 24`);
console.log('=====FULL SUMMARY TEXT=====');
console.log(res2.rows[0].summary_text);
process.exit(0);
