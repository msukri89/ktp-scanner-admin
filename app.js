const video = document.getElementById('video');
const canvas = document.getElementById('captureCanvas');
const photoPreview = document.getElementById('photoPreview');
const context = canvas.getContext('2d');

// 1. Jalankan Kamera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; });

// 2. Fungsi Utama Scan
async function takePhoto() {
    const btn = document.getElementById('btnCapture');
    btn.innerText = "Memproses...";
    btn.disabled = true;

    // A. Ambil Gambar Diam
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // B. Pre-processing (Hitam Putih Tajam)
    let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    let pixels = imageData.data;
    for (let i = 0; i < pixels.length; i += 4) {
        let grayscale = pixels[i] * 0.3 + pixels[i+1] * 0.59 + pixels[i+2] * 0.11;
        let v = (grayscale > 120) ? 255 : 0; 
        pixels[i] = pixels[i+1] = pixels[i+2] = v;
    }
    context.putImageData(imageData, 0, 0);

    // C. Tampilkan Preview
    photoPreview.src = canvas.toDataURL('image/png');
    photoPreview.style.display = 'block';
    video.style.display = 'none';

    // D. Jalankan OCR Tesseract
    Tesseract.recognize(canvas, 'ind')
    .then(({ data: { text } }) => {
        console.log("Raw OCR Data:", text);
        parseData(text);
        
        btn.innerText = "SCAN ULANG";
        btn.disabled = false;
        btn.onclick = resetCamera;
    });
}

// 3. Logika Pembersihan Teks (Lebih Agresif)
function parseData(rawText) {
    // Bersihkan NIK: Cari 16 angka, toleransi spasi atau karakter aneh
    const cleanText = rawText.replace(/[^0-9a-zA-Z\n]/g, ' ');
    const nikMatch = cleanText.replace(/\s/g, '').match(/\d{16}/);
    if (nikMatch) document.getElementById('nik').value = nikMatch[0];

    // Cari Nama: Mencari baris setelah NIK atau baris yang mengandung 'NAMA'
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
    
    let foundName = "";
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].toUpperCase();
        
        // Jika baris mengandung NIK, biasanya Nama ada di 1-2 baris setelahnya
        if (line.match(/\d{10,16}/) && lines[i+1]) {
            foundName = lines[i+1];
        } 
        // Atau jika baris mengandung kata mirip 'NAMA'
        else if (line.includes("NAM") || line.includes("VAM") || line.includes("MAA")) {
            foundName = lines[i].split(/[:\s]/).slice(1).join(' ');
        }

        if (foundName) {
            // Bersihkan Nama dari angka dan simbol
            document.getElementById('nama').value = foundName.replace(/[^a-zA-Z\s]/g, '').trim().toUpperCase();
            break;
        }
    }
}

function resetCamera() {
    video.style.display = 'block';
    photoPreview.style.display = 'none';
    const btn = document.getElementById('btnCapture');
    btn.innerText = "AMBIL FOTO & PINDAI";
    btn.onclick = takePhoto;
}

function sendToGAS() {
    const scriptURL = 'https://script.google.com/macros/s/AKfycbwKebiI0jRkDAJwY1IaYuxyfOrBdnHGJs4TAGcIHgvB844HxHzsio2GhwEJ32AOe_0ERQ/exec';
    const payload = {
        nik: document.getElementById('nik').value,
        nama: document.getElementById('nama').value,
        desa: document.getElementById('desa').value
    };

    fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) })
    .then(() => alert("Berhasil Masuk Spreadsheet!"))
    .catch(() => alert("Gagal kirim data"));
}
