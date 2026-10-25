const Database = require('better-sqlite3');
const db = new Database('presensi.db');

// Inisialisasi tabel
db.exec(`
  CREATE TABLE IF NOT EXISTS siswa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid_rfid TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    kelas TEXT
  );

  CREATE TABLE IF NOT EXISTS kehadiran (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    siswa_id INTEGER,
    waktu_masuk DATETIME DEFAULT CURRENT_TIMESTAMP,
    foto TEXT,
    denyut_nadi INTEGER,
    spo2 INTEGER,
    FOREIGN KEY(siswa_id) REFERENCES siswa(id)
  );
`);

// Data contoh siswa (sesuaikan dengan UID RFID kamu)
const count = db.prepare('SELECT COUNT(*) as c FROM siswa').get().c;
if (count === 0) {
  const insert = db.prepare('INSERT INTO siswa (uid_rfid, nama, kelas) VALUES (?, ?, ?)');
  insert.run('A1B2C3D4', 'Ahmad Rizki', 'XII RPL 1');
  insert.run('E5F6G7H8', 'Budi Santoso', 'XII RPL 1');
  insert.run('I9J0K1L2', 'Citra Dewi', 'XII RPL 2');
  console.log('✅ Data contoh siswa ditambahkan');
}

module.exports = db;