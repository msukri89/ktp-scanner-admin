const video = document.getElementById('video');
const canvas = document.getElementById('captureCanvas');
const photoPreview = document.getElementById('photoPreview');
const context = canvas.getContext('2d');

// 1. Jalankan Kamera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; });

// 2. Fungsi Utama
async function takePhoto() {
    const btn = document.getElementById('btnCapture');
    btn.innerText = "Memproses...";
    btn.disabled = true;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // PRE-PROCESSING (Pembersihan ke Hitam-Putih seperti di video Anda)
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        let grayscale = pixels[i] * 0.3 + pixels[i+1] * 0.59 + pixels[i+2] * 0.11;
        let v = (grayscale > 120) ? 255 : 0; // Thresholding tajam
        pixels[i] = pixels[i+1] = pixels[i+2] = v;
    }
    context.putImageData(imageData, 0, 0);

    // Tampilkan Foto Diam
    photoPreview.src = canvas.toDataURL('image/png');
    photoPreview.style.display = 'block';
    video.style.display = 'none';

    // JALANKAN OCR DENGAN CONFIG KHUSUS
    Tesseract.recognize(canvas, 'ind', {
        logger: m => console.log(m) 
    }).then(({ data: { text } }) => {
        console.log("Raw Text:", text);
        
        // Membersihkan NIK (Cari 16 digit angka saja)
        const nikMatch = text.replace(/\s/g, '').match(/\d{16}/);
        if (nikMatch) {
            document.getElementById('nik').value = nikMatch[0];
        }

        // Membersihkan Nama (Mencari baris setelah label 'Nama')
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].toUpperCase();
            if (line.includes("NAMA")) {
                // Ambil teks setelah kata Nama atau titik dua
                let cleanName = lines[i].split(/[:\s]/).slice(1).join(' ').trim();
                // Buang karakter aneh hasil OCR yang sering muncul di ujung
                document.getElementById('nama').value = cleanName.replace(/[^a-zA-Z\s]/g, '').trim();
                break;
            }
        }

        btn.innerText = "SCAN ULANG";
        btn.disabled = false;
        btn.onclick = resetCamera;
    });
}

function resetCamera() {
    video.style.display = 'block';
    photoPreview.style.display = 'none';
    const btn = document.getElementById('btnCapture');
    btn.innerText = "AMBIL FOTO & PINDAI";
    btn.onclick = takePhoto;
    document.getElementById('nik').value = "";
    document.getElementById('nama').value = "";
}

function sendToGAS() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwKebiI0jRkDAJwY1IaYuxyfOrBdnHGJs4TAGcIHgvB844HxHzsio2GhwEJ32AOe_0ERQ/exec';
    const payload = {
        nik: document.getElementById('nik').value,
        nama: document.getElementById('nama').value,
        desa: document.getElementById('desa').value
    };

    fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) })
    .then(() => {
        alert("Data Sukses Masuk Spreadsheet!");
        resetCamera();
    })
    .catch(() => alert("Gagal kirim. Cek koneksi atau URL GAS Anda."));
}
