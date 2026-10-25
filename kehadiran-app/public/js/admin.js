// Set default tanggal hari ini
document.getElementById('filterTanggal').valueAsDate = new Date();

async function loadAdminData() {
  const tanggal = document.getElementById('filterTanggal').value;
  try {
    const res = await fetch(`/api/admin/presensi?tanggal=${tanggal}`);
    const data = await res.json();

    document.getElementById('countBadge').textContent = `${data.data.length} data`;

    const tbody = document.getElementById('adminBody');
    if (data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:#94a3b8;">Tidak ada data</td></tr>';
      return;
    }

    tbody.innerHTML = data.data.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${item.nama}</strong></td>
        <td>${item.kelas}</td>
        <td>${new Date(item.waktu_masuk).toLocaleTimeString('id-ID')}</td>
        <td><span class="pulse">❤️</span> ${item.denyut_nadi || '-'} bpm</td>
        <td>${item.spo2 ? item.spo2 + '%' : '-'}</td>
        <td>${item.foto 
          ? `<img src="${item.foto}" class="foto-thumb" onclick="showDetail(${item.id}, '${item.nama.replace(/'/g, "\\'")}', '${item.foto}', ${item.denyut_nadi || 'null'}, ${item.spo2 || 'null'}, '${new Date(item.waktu_masuk).toLocaleString('id-ID')}')">`
          : '<span style="color:#94a3b8;">Tidak ada</span>'}
        </td>
        <td>
          <button class="btn btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" 
            onclick="showDetail(${item.id}, '${item.nama.replace(/'/g, "\\'")}', '${item.foto}', ${item.denyut_nadi || 'null'}, ${item.spo2 || 'null'}, '${new Date(item.waktu_masuk).toLocaleString('id-ID')}')">
            Detail
          </button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

function showDetail(id, nama, foto, nadi, spo2, waktu) {
  document.getElementById('modalNama').textContent = nama;
  document.getElementById('modalFoto').innerHTML = foto 
    ? `<img src="${foto}" alt="Foto Presensi">` 
    : '<p style="color:#94a3b8; text-align:center;">Tidak ada foto</p>';
  document.getElementById('modalDetail').innerHTML = `
    <div class="detail-row"><span class="label">Waktu Hadir</span><span class="value">${waktu}</span></div>
    <div class="detail-row"><span class="label">Denyut Nadi</span><span class="value"><span class="pulse">❤️</span> ${nadi || '-'} bpm</span></div>
    <div class="detail-row"><span class="label">Kadar Oksigen (SpO2)</span><span class="value">${spo2 ? spo2 + '%' : '-'}</span></div>
  `;
  document.getElementById('modalDetail').parentElement.classList.add('active');
}

function closeModal() {
  document.getElementById('modalDetail').parentElement.classList.remove('active');
}

async function loadSiswa() {
  const res = await fetch('/api/siswa');
  const data = await res.json();
  document.getElementById('siswaBody').innerHTML = data.data.map(s => `
    <tr>
      <td><code style="color:#38bdf8;">${s.uid_rfid}</code></td>
      <td>${s.nama}</td>
      <td>${s.kelas}</td>
      <td><button class="btn btn-danger" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="hapusSiswa(${s.id})">Hapus</button></td>
    </tr>
  `).join('');
}

function toggleFormSiswa() {
  const form = document.getElementById('formSiswa');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

async function tambahSiswa() {
  const uid = document.getElementById('inputUid').value.trim();
  const nama = document.getElementById('inputNama').value.trim();
  const kelas = document.getElementById('inputKelas').value.trim();

  if (!uid || !nama || !kelas) {
    alert('Semua field wajib diisi!');
    return;
  }

  const res = await fetch('/api/siswa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid_rfid: uid, nama, kelas })
  });

  const data = await res.json();
  if (data.success) {
    alert('Siswa berhasil ditambahkan');
    document.getElementById('inputUid').value = '';
    document.getElementById('inputNama').value = '';
    document.getElementById('inputKelas').value = '';
    toggleFormSiswa();
    loadSiswa();
  } else {
    alert('Gagal: ' + data.message);
  }
}

async function hapusSiswa(id) {
  if (!confirm('Yakin hapus siswa ini?')) return;
  await fetch(`/api/siswa/${id}`, { method: 'DELETE' });
  loadSiswa();
}

// Inisialisasi
loadAdminData();
loadSiswa();