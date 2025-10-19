// ===============================
// FIREBASE SETUP
// ===============================
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { data } from "./soal.js";
import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===============================
// ELEMENT HTML
// ===============================
const namaInput = document.getElementById("namaPemain");
const mulaiBtn = document.getElementById("mulaiBtn");
const levelSelect = document.getElementById("levelSelect");
const kuisContainer = document.getElementById("kuis-container");
const soalText = document.getElementById("pertanyaan");
const pilihanContainer = document.getElementById("pilihan-container");
const hasilFeedback = document.getElementById("hasil-feedback");
const skorText = document.getElementById("skor");
const donasiBtn = document.getElementById("donasiBtn");
const popupDonasi = document.getElementById("popupDonasi");
const tutupPopup = document.getElementById("tutupPopup");
const audioCorrect = document.getElementById("audioCorrect");
const audioWrong = document.getElementById("audioWrong");
const selesaiBtn = document.getElementById("selesaiBtn");

let namaPemain = "";
let levelDipilih = "agama";
let indexSoal = 0;
let skor = 0;
let soalAcak = [];

// ===============================
// ANIMASI AWAL
// ===============================
window.addEventListener("load", () => {
  donasiBtn.classList.add("bounce", "pointing");
  donasiBtn.style.opacity = 1;
  document.getElementById("copyright").style.opacity = 1;
});

// ===============================
// MULAI KUIS
// ===============================
mulaiBtn.addEventListener("click", () => {
  const nama = namaInput.value.trim();
  if (nama === "") {
    alert("Masukkan nama kamu dulu, ya!");
    return;
  }

  namaPemain = nama;
  levelDipilih = levelSelect.value;
  indexSoal = 0;
  skor = 0;

  // Acak soal sebelum mulai
  soalAcak = acakArray([...data[levelDipilih]]);

  // Simpan data awal pemain ke Firebase
  const pemainRef = ref(db, "pemain");
  push(pemainRef, {
    nama: namaPemain,
    level: levelDipilih,
    waktu: new Date().toLocaleString("id-ID"),
    skor: 0
  });

  // Tampilkan kuis
  document.getElementById("nama-container").style.display = "none";
  kuisContainer.style.display = "block";

  // Tampilkan nama pemain
  const namaTampil = document.getElementById("namaPemainTampil");
  if (namaTampil) namaTampil.textContent = `👤 Pemain: ${namaPemain}`;

  mulaiKuis();
});

// ===============================
// FUNGSI ACAK ARRAY (FISHER-YATES SHUFFLE)
// ===============================
function acakArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===============================
// FUNGSI MENAMPILKAN SOAL
// ===============================
function mulaiKuis() {
  const soalSekarang = soalAcak[indexSoal];
  soalText.textContent = soalSekarang.q;

  pilihanContainer.innerHTML = "";
  soalSekarang.options.forEach((opsi) => {
    const tombol = document.createElement("button");
    tombol.textContent = opsi;
    tombol.addEventListener("click", () => periksaJawaban(opsi, soalSekarang.a));
    pilihanContainer.appendChild(tombol);
  });

  skorText.textContent = `Skor: ${skor}`;
}

// ===============================
// PERIKSA JAWABAN
// ===============================
function periksaJawaban(jawaban, kunci) {
  const benar = jawaban === kunci;

  if (benar) {
    skor += 10;
    hasilFeedback.textContent = "✅ Jawaban Benar!";
    hasilFeedback.className = "correct";
    audioCorrect.play();
    document.dispatchEvent(new CustomEvent("answerResult", { detail: { correct: true } }));
  } else {
    hasilFeedback.textContent = `❌ Salah! Jawaban benar: ${kunci}`;
    hasilFeedback.className = "wrong";
    audioWrong.play();
    document.dispatchEvent(new CustomEvent("answerResult", { detail: { correct: false } }));
  }

  skorText.textContent = `Skor: ${skor}`;

  setTimeout(() => {
    indexSoal++;
    if (indexSoal < soalAcak.length) {
      hasilFeedback.textContent = "";
      mulaiKuis();
    } else {
      selesaiKuis("otomatis");
    }
  }, 1000);
}

// ===============================
// SELESAI KUIS
// ===============================
function selesaiKuis(mode = "otomatis") {
  soalText.textContent = `🎉 Kuis selesai!`;
  pilihanContainer.innerHTML = "";
  hasilFeedback.textContent = `Selamat ${namaPemain}! Skor akhir kamu: ${skor}`;
  hasilFeedback.className = "correct";

  // Simpan skor akhir ke Firebase
  const hasilRef = ref(db, "hasil");
  push(hasilRef, {
    nama: namaPemain,
    level: levelDipilih,
    skor: skor,
    waktu: new Date().toLocaleString("id-ID"),
    status: mode === "manual" ? "selesai manual" : "selesai otomatis"
  });

  // Tampilkan popup interaktif
  setTimeout(() => {
    tampilkanPopupSelesai();
  }, 500);
}

// ===============================
// TOMBOL SELESAI / RESET MANUAL
// ===============================
selesaiBtn.addEventListener("click", () => {
  if (confirm("Apakah kamu yakin ingin mengakhiri kuis sekarang?")) {
    selesaiKuis("manual");
  }
});

// ===============================
// POPUP UCAPAN TERIMAKASIH
// ===============================
function tampilkanPopupSelesai() {
  // Buat overlay popup
  const popup = document.createElement("div");
  popup.style.position = "fixed";
  popup.style.top = "0";
  popup.style.left = "0";
  popup.style.width = "100%";
  popup.style.height = "100%";
  popup.style.background = "rgba(0,0,0,0.6)";
  popup.style.display = "flex";
  popup.style.justifyContent = "center";
  popup.style.alignItems = "center";
  popup.style.zIndex = "10000";

  // Isi konten popup
  popup.innerHTML = `
    <div style="
      background:white;
      padding:30px;
      border-radius:12px;
      max-width:350px;
      text-align:center;
      font-family:'Poppins',sans-serif;
      box-shadow:0 4px 10px rgba(0,0,0,0.3);
      animation:fadeIn 0.4s ease;
    ">
      <h3>🎉 Terima Kasih, ${namaPemain}!</h3>
      <p>Skor kamu: <b>${skor}</b></p>
      <p>Mau main lagi?</p>
      <button id="ulangBtn" style="background:#007bff;color:white;border:none;padding:10px 20px;border-radius:6px;margin:5px;cursor:pointer;">🔁 Main Lagi</button>
      <button id="keluarBtn" style="background:#dc3545;color:white;border:none;padding:10px 20px;border-radius:6px;margin:5px;cursor:pointer;">🚪 Keluar</button>
    </div>
  `;

  document.body.appendChild(popup);

  // Tombol "Main Lagi"
  document.getElementById("ulangBtn").addEventListener("click", () => {
    popup.remove();
    kuisContainer.style.display = "none";
    document.getElementById("nama-container").style.display = "block";
    namaInput.value = "";
  });

  // Tombol "Keluar"
  document.getElementById("keluarBtn").addEventListener("click", () => {
    alert("Terima kasih sudah bermain! 🙏");
    popup.remove();
    kuisContainer.style.display = "none";
    document.getElementById("nama-container").style.display = "block";
    namaInput.value = "";
  });
}

// ===============================
// POPUP DONASI
// ===============================
donasiBtn.addEventListener("click", () => {
  popupDonasi.style.display = "flex";
});
tutupPopup.addEventListener("click", () => {
  popupDonasi.style.display = "none";
});