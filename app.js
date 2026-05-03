const video = document.getElementById('video');
const canvas = document.getElementById('captureCanvas');
const photoPreview = document.getElementById('photoPreview');
const overlay = document.getElementById('overlay');
const statusText = document.getElementById('status');
const context = canvas.getContext('2d');

// 1. Inisialisasi Kamera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => { alert("Gagal akses kamera: " + err); });

// 2. Fungsi Ambil Foto & OCR
async function takePhoto() {
    const btn = document.getElementById('btnCapture');
    btn.innerText = "Memproses...";
    btn.disabled = true;
    statusText.innerText = "Status: Mengambil gambar...";

    // A. Capture gambar dari video ke canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // B. Pre-processing (Binarization) agar gambar hitam-putih pekat
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        let grayscale = pixels[i] * 0.3 + pixels[i+1] * 0.59 + pixels[i+2] * 0.11;
        let v = (grayscale > 125) ? 255 : 0; // Efek hitam-putih tajam
        pixels[i] = pixels[i+1] = pixels[i+2] = v;
    }
    context.putImageData(imageData, 0, 0);

    // C. Freeze Layar: Sembunyikan kamera, tampilkan foto diam
    photoPreview.src = canvas.toDataURL('image/png');
    photoPreview.style.display = 'block';
    video.style.display = 'none';
    overlay.style.display = 'none';

    statusText.innerText = "Status: Mengekstrak teks (OCR)...";

    // D. Jalankan Tesseract OCR
    Tesseract.recognize(canvas, 'ind')
    .then(({ data: { text } }) => {
        console.log("Hasil Mentah:", text);
        
        // Parsing NIK (Cari 16 digit angka)
        const nikMatch = text.match(/\d{16}/);
        if (nikMatch) document.getElementById('nik').value = nikMatch[0];

        // Parsing Nama (Cari baris setelah kata Nama)
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toUpperCase().includes("NAMA")) {
                let cleanName = lines[i].replace(/Nama|:|nama|NAIMA/gi, "").trim();
                document.getElementById('nama').value = cleanName;
                break;
            }
        }

        statusText.innerText = "Status: Selesai. Silakan cek data.";
        btn.innerText = "SCAN ULANG";
        btn.disabled = false;
        btn.onclick = resetCamera;
    })
    .catch(err => {
        alert("OCR Gagal: " + err);
        resetCamera();
    });
}

// 3. Fungsi Kembali ke Kamera
function resetCamera() {
    video.style.display = 'block';
    photoPreview.style.display = 'none';
    overlay.style.display = 'block';
    statusText.innerText = "Status: Siap";
    const btn = document.getElementById('btnCapture');
    btn.innerText = "AMBIL FOTO & PINDAI";
    btn.onclick = takePhoto;
}

// 4. Kirim Data ke Google Sheets (GAS)
function sendToGAS() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwKebiI0jRkDAJwY1IaYuxyfOrBdnHGJs4TAGcIHgvB844HxHzsio2GhwEJ32AOe_0ERQ/exec'; // GANTI DENGAN URL GAS ANDA!
    const btnSubmit = document.getElementById('btnSubmit');
    
    btnSubmit.innerText = "Mengirim...";
    btnSubmit.disabled = true;

    const payload = {
        nik: document.getElementById('nik').value,
        nama: document.getElementById('nama').value,
        alamat_detail: document.getElementById('alamat').value,
        desa: document.getElementById('desa').value
    };

    fetch(scriptURL, { 
        method: 'POST', 
        mode: 'no-cors', // Penting untuk bypass CORS Google Apps Script
        cache: 'no-cache',
        body: JSON.stringify(payload) 
    })
    .then(() => {
        alert("Data Berhasil Tersimpan!");
        btnSubmit.innerText = "SIMPAN KE SPREADSHEET";
        btnSubmit.disabled = false;
        resetCamera();
    })
    .catch(err => {
        alert("Gagal Kirim ke Spreadsheet: " + err);
        btnSubmit.disabled = false;
    });
}
