// --- Ganti bagian ini untuk mengedit data produk, harga, stok awal, dan deskripsi ---
const produkList = [
  {
    nama: "Falcataria moluccana",
    harga: 208913,
    stok: 150,
    deskripsi: "Pohon cepat tumbuh, cocok untuk penghijauan dan produksi kayu ringan.",
    gambar: "falcataria.jpg"
  },
  {
    nama: "Swietenia macrophylla",
    harga: 208913,
    stok: 150,
    deskripsi: "Pohon mahoni, kayu keras berkualitas tinggi untuk konstruksi dan mebel.",
    gambar: "swietenia.jpg"
  },
  {
    nama: "Gmelina arborea",
    harga: 208913,
    stok: 150,
    deskripsi: "Kayu serbaguna, pertumbuhan cepat, cocok untuk industri dan penghijauan.",
    gambar: "gmelina.jpg"
  },
  {
    nama: "Shorea leprosula",
    harga: 208913,
    stok: 150,
    deskripsi: "Meranti merah, kayu komersial unggul, sering digunakan untuk reboisasi.",
    gambar: "shorea.jpg"
  }
];
// Key untuk localStorage
const STORAGE_KEY = "g9_bibit_data";
const QC_KEY = "g9_qc_data";

// --- Ambil stok yang tersimpan di localStorage, jika ada ---
function getProdukData() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Jika ada update data produk, pastikan urutan dan nama tetap sama
      return produkList.map((prod, i) => ({
        ...prod,
        ...parsed[i],
        nama: prod.nama,
        harga: parsed[i]?.harga || prod.harga,
        deskripsi: prod.deskripsi,
        gambar: prod.gambar
      }));
    } catch {
      return [...produkList];
    }
  } else {
    return [...produkList];
  }
}
function saveProdukData(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
// --- Quality control data (jumlah hidup/mati) ---
function getQCData() {
  const data = localStorage.getItem(QC_KEY);
  if (data) {
    return JSON.parse(data);
  } else {
    return produkList.map(_ => ({ hidup: 0, mati: 0 }));
  }
}
function saveQCData(list) {
  localStorage.setItem(QC_KEY, JSON.stringify(list));
}

// --- Render produk untuk pelanggan ---
function renderProduk() {
  const produk = getProdukData();
  const el = document.getElementById('daftar-produk');
  el.innerHTML = '';
  produk.forEach((prod, i) => {
    const card = document.createElement('div');
    card.className = "produk-card";
    card.innerHTML = `
      <div class="produk-header">
        <img src="${prod.gambar}" alt="${prod.nama}">
        <div class="produk-info">
          <h4>${prod.nama}</h4>
          <div class="harga">Rp ${prod.harga.toLocaleString('id-ID')}</div>
          <div class="stok">Stok: <span id="stok-produk-${i}">${prod.stok}</span></div>
        </div>
      </div>
      <p class="deskripsi">${prod.deskripsi}</p>
      <button onclick="addToCart(${i})" ${prod.stok === 0 ? "disabled" : ""}>Tambah ke Keranjang</button>
    `;
    el.appendChild(card);
  });
}
window.renderProduk = renderProduk;

// --- Keranjang sederhana di memori saja (tidak pakai localStorage) ---
let cart = [];
function addToCart(idx) {
  const produk = getProdukData();
  if (produk[idx].stok > 0) {
    const found = cart.find(c => c.idx === idx);
    if (found) {
      if (found.jumlah < produk[idx].stok) {
        found.jumlah += 1;
      }
    } else {
      cart.push({ idx, jumlah: 1 });
    }
    renderCart();
  }
}
function renderCart() {
  const produk = getProdukData();
  const cartList = document.getElementById('cart-list');
  if (cart.length === 0) {
    cartList.innerHTML = "<em>Keranjang kosong.</em>";
    return;
  }
  cartList.innerHTML = `
    <ul>
      ${cart.map(c => `
        <li>
          ${produk[c.idx].nama} × ${c.jumlah} 
          <button onclick="removeCart(${c.idx})" style="margin-left:8px;">Hapus</button>
        </li>
      `).join('')}
    </ul>
    <div><strong>Total: Rp ${cart.reduce((sum, c) => sum + produk[c.idx].harga * c.jumlah, 0).toLocaleString('id-ID')}</strong></div>
  `;
}
window.addToCart = addToCart;
// Hapus dari keranjang
function removeCart(idx) {
  cart = cart.filter(c => c.idx !== idx);
  renderCart();
}
window.removeCart = removeCart;

// --- Checkout ---
const checkoutForm = document.getElementById('checkout-form');
checkoutForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (cart.length === 0) {
    document.getElementById('checkout-message').textContent = "Keranjang masih kosong.";
    return;
  }
  // Kurangi stok
  let produk = getProdukData();
  let stokCukup = true;
  cart.forEach(item => {
    if (produk[item.idx].stok < item.jumlah) stokCukup = false;
  });
  if (!stokCukup) {
    document.getElementById('checkout-message').textContent = "Stok tidak mencukupi.";
    return;
  }
  cart.forEach(item => {
    produk[item.idx].stok -= item.jumlah;
  });
  saveProdukData(produk);
  renderProduk();
  cart = [];
  renderCart();
  document.getElementById('checkout-message').textContent = "Pesanan anda sedang disiapkan";
  checkoutForm.reset();
  setTimeout(() => {
    document.getElementById('checkout-message').textContent = "";
  }, 3000);
});

// --- Admin/Pegawai Login ---
const ADMIN_USER = "user123";
const ADMIN_PASS = "12345678";
let adminLoggedIn = false;
function showAdminPanel() {
  document.getElementById('admin-login').style.display = "none";
  document.getElementById('admin-panel').style.display = "";
}
function hideAdminPanel() {
  document.getElementById('admin-login').style.display = "";
  document.getElementById('admin-panel').style.display = "none";
}
function renderAdminPanel() {
  // Update stok form
  const produk = getProdukData();
  const stokDiv = document.getElementById('update-stok');
  stokDiv.innerHTML = '';
  produk.forEach((prod, i) => {
    const row = document.createElement('div');
    row.innerHTML = `
      <strong>${prod.nama}</strong> | Stok: <span id="admin-stok-${i}">${prod.stok}</span>
      <input type="number" min="0" value="${prod.stok}" id="stok-input-${i}" style="margin-left:8px;">
      <button onclick="updateStok(${i})">Update</button>
    `;
    stokDiv.appendChild(row);
  });

  // Quality control
  const qc = getQCData();
  const qcDiv = document.getElementById('quality-control');
  qcDiv.innerHTML = '';
  produk.forEach((prod, i) => {
    const row = document.createElement('div');
    row.innerHTML = `
      <strong>${prod.nama}</strong> | Hidup: <input type="number" min="0" value="${qc[i]?.hidup||0}" id="qc-hidup-${i}" style="width:50px;">
      Mati: <input type="number" min="0" value="${qc[i]?.mati||0}" id="qc-mati-${i}" style="width:50px;">
      <button onclick="saveQC(${i})">Simpan QC</button>
    `;
    qcDiv.appendChild(row);
  });
}
window.updateStok = function(i) {
  const val = parseInt(document.getElementById('stok-input-' + i).value);
  if (isNaN(val) || val < 0) return;
  let produk = getProdukData();
  produk[i].stok = val;
  saveProdukData(produk);
  renderProduk();
  renderAdminPanel();
};
window.saveQC = function(i) {
  const hidup = parseInt(document.getElementById('qc-hidup-' + i).value) || 0;
  const mati = parseInt(document.getElementById('qc-mati-' + i).value) || 0;
  let qc = getQCData();
  qc[i] = { hidup, mati };
  saveQCData(qc);
  renderAdminPanel();
};

// --- Login logic ---
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const user = loginForm.username.value;
  const pass = loginForm.password.value;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    adminLoggedIn = true;
    showAdminPanel();
    renderAdminPanel();
    document.getElementById('login-message').textContent = '';
    loginForm.reset();
  } else {
    document.getElementById('login-message').textContent = "Username atau password salah!";
  }
});
document.getElementById('logout-btn').onclick = function() {
  adminLoggedIn = false;
  hideAdminPanel();
};

// --- Inisialisasi halaman ---
renderProduk();
renderCart();
hideAdminPanel();

// === Partnership Section ===
const partnershipSection = document.createElement("section");
partnershipSection.id = "partnership";

// Judul section
const title = document.createElement("h2");
title.textContent = "Partnership";

// Deskripsi
const desc = document.createElement("p");
desc.textContent = "Persemaian ini dikembangkan melalui kerja sama:";

// Container logo
const container = document.createElement("div");
container.classList.add("partner-logos");

// Data partner (nama + logo)
const partners = [
  { name: "Program Studi Rekayasa Kehutanan - ITB", logo: "itb.png" },
  { name: "Kementerian Lingkungan Hidup dan Kehutanan (KLHK)", logo: "klhk.png" },
  { name: "Perum Perhutani", logo: "perhutani.png" }
];

// Tambahkan setiap partner ke container
partners.forEach(partner => {
  const div = document.createElement("div");
  div.classList.add("partner-item");

  const img = document.createElement("img");
  img.src = partner.logo;
  img.alt = partner.name;

  const p = document.createElement("p");
  p.textContent = partner.name;

  div.appendChild(img);
  div.appendChild(p);
  container.appendChild(div);
});

// Gabungkan elemen
partnershipSection.appendChild(title);
partnershipSection.appendChild(desc);
partnershipSection.appendChild(container);

// Tambahkan ke akhir body
document.body.appendChild(partnershipSection);

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("testimonial-list");
  const textInput = document.getElementById("testimonial-text");
  const nameInput = document.getElementById("testimonial-name");
  const addBtn = document.getElementById("add-testimonial");

  // Ambil testimoni tambahan dari localStorage
  const savedTestimonials = JSON.parse(localStorage.getItem("extraTestimonials")) || [];

  // Tampilkan testimoni tambahan
  savedTestimonials.forEach(t => addTestimonialToDOM(t.text, t.name));

  // Saat tombol ditekan
  addBtn.addEventListener("click", () => {
    const text = textInput.value.trim();
    const name = nameInput.value.trim();

    if (!text || !name) {
      alert("Isi nama dan testimoni dulu ya!");
      return;
    }

    // Simpan ke localStorage
    savedTestimonials.push({ text, name });
    localStorage.setItem("extraTestimonials", JSON.stringify(savedTestimonials));

    // Tambahkan ke halaman
    addTestimonialToDOM(text, name);

    textInput.value = "";
    nameInput.value = "";
  });

  // Fungsi untuk menambahkan testimoni baru ke DOM
  function addTestimonialToDOM(text, name) {
    const div = document.createElement("div");
    div.className = "testimonial-item";
    div.innerHTML = `
      <p class="testimonial-text">"${text}"</p>
      <p class="testimonial-author">— ${name}</p>
    `;
    list.appendChild(div);
  }
});
