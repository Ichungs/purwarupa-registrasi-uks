async function loadKehadiran() {
  try {
    const [statsRes, hadirRes] = await Promise.all([
      fetch('/api/stats'),
      fetch('/api/kehadiran')
    ]);
    
    const stats = await statsRes.json();
    const hadir = await hadirRes.json();

    // Update stats
    document.getElementById('totalSiswa').textContent = stats.data.totalSiswa;
    document.getElementById('hadirHariIni').textContent = stats.data.hadirHariIni;
    document.getElementById('tanggal').textContent = new Date().toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    // Update tabel
    const tbody = document.getElementById('kehadiranBody');
    if (hadir.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8;">Belum ada yang hadir hari ini</td></tr>';
      return;
    }

    tbody.innerHTML = hadir.data.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${item.nama}</strong></td>
        <td>${item.kelas}</td>
        <td>${new Date(item.waktu_masuk).toLocaleTimeString('id-ID')}</td>
        <td><span class="badge badge-success">✓ Hadir</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
    showToast('Gagal memuat data', 'error');
  }
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Load saat halaman dibuka
loadKehadiran();

// Auto refresh setiap 5 detik (untuk update real-time saat siswa tap RFID)
setInterval(loadKehadiran, 5000);