const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Pastikan folder uploads ada
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Konfigurasi multer untuk upload foto dari ESP32-CAM
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `foto_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// ============================================
// API UNTUK ESP32 (Endpoint Presensi)
// ============================================

// Endpoint: ESP32 kirim data presensi (RFID + foto + oximeter)
app.post('/api/presensi', upload.single('foto'), (req, res) => {
  try {
    const { uid_rfid, denyut_nadi, spo2 } = req.body;
    
    if (!uid_rfid) {
      return res.status(400).json({ success: false, message: 'UID RFID wajib diisi' });
    }

    // Cari siswa berdasarkan UID RFID
    const siswa = db.prepare('SELECT * FROM siswa WHERE uid_rfid = ?').get(uid_rfid);
    
    if (!siswa) {
      return res.status(404).json({ 
        success: false, 
        message: `UID ${uid_rfid} tidak terdaftar` 
      });
    }

    // Cek apakah sudah absen hari ini
    const today = new Date().toISOString().split('T')[0];
    const sudahAbsen = db.prepare(`
      SELECT * FROM kehadiran 
      WHERE siswa_id = ? AND DATE(waktu_masuk) = ?
    `).get(siswa.id, today);

    if (sudahAbsen) {
      return res.status(400).json({ 
        success: false, 
        message: `${siswa.nama} sudah absen hari ini`,
        data: sudahAbsen
      });
    }

    // Simpan data kehadiran
    const fotoPath = req.file ? `/uploads/${req.file.filename}` : null;
    
    const result = db.prepare(`
      INSERT INTO kehadiran (siswa_id, foto, denyut_nadi, spo2) 
      VALUES (?, ?, ?, ?)
    `).run(siswa.id, fotoPath, denyut_nadi || null, spo2 || null);

    res.json({
      success: true,
      message: `Presensi ${siswa.nama} berhasil`,
      data: {
        id: result.lastInsertRowid,
        nama: siswa.nama,
        kelas: siswa.kelas,
        waktu: new Date().toLocaleString('id-ID'),
        foto: fotoPath,
        denyut_nadi: denyut_nadi,
        spo2: spo2
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================
// API UNTUK FRONTEND
// ============================================

// GET: Daftar kehadiran hari ini (untuk menu kehadiran)
app.get('/api/kehadiran', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const data = db.prepare(`
    SELECT k.id, s.nama, s.kelas, k.waktu_masuk 
    FROM kehadiran k 
    JOIN siswa s ON k.siswa_id = s.id
    WHERE DATE(k.waktu_masuk) = ?
    ORDER BY k.waktu_masuk DESC
  `).all(today);
  
  res.json({ success: true, data });
});

// GET: Data lengkap untuk admin (dengan foto & oximeter)
app.get('/api/admin/presensi', (req, res) => {
  const { tanggal } = req.query;
  const filterDate = tanggal || new Date().toISOString().split('T')[0];
  
  const data = db.prepare(`
    SELECT k.*, s.nama, s.kelas, s.uid_rfid
    FROM kehadiran k
    JOIN siswa s ON k.siswa_id = s.id
    WHERE DATE(k.waktu_masuk) = ?
    ORDER BY k.waktu_masuk DESC
  `).all(filterDate);
  
  res.json({ success: true, data });
});

// GET: Daftar siswa (untuk admin kelola data)
app.get('/api/siswa', (req, res) => {
  const data = db.prepare('SELECT * FROM siswa ORDER BY nama').all();
  res.json({ success: true, data });
});

// POST: Tambah siswa baru
app.post('/api/siswa', (req, res) => {
  const { uid_rfid, nama, kelas } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO siswa (uid_rfid, nama, kelas) VALUES (?, ?, ?)'
    ).run(uid_rfid, nama, kelas);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ success: false, message: 'UID RFID sudah terdaftar' });
  }
});

// DELETE: Hapus siswa
app.delete('/api/siswa/:id', (req, res) => {
  db.prepare('DELETE FROM siswa WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Stats untuk dashboard admin
app.get('/api/stats', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const totalSiswa = db.prepare('SELECT COUNT(*) as c FROM siswa').get().c;
  const hadirHariIni = db.prepare(
    'SELECT COUNT(*) as c FROM kehadiran WHERE DATE(waktu_masuk) = ?'
  ).get(today).c;
  
  res.json({
    success: true,
    data: { totalSiswa, hadirHariIni, tanggal: today }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📡 Endpoint ESP32: POST http://<IP_SERVER>:${PORT}/api/presensi`);
});