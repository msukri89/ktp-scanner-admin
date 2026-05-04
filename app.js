const video = document.getElementById('video');
const canvas = document.getElementById('captureCanvas');
const photoPreview = document.getElementById('photoPreview');

// Aktifkan Kamera
navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => { video.srcObject = stream; });

async function takePhoto() {
    const btn = document.getElementById('btnCapture');
    const status = document.getElementById('status'); // Pastikan ada elemen status di HTML
    
    btn.innerText = "Memproses di Server Google...";
    btn.disabled = true;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    // Tampilkan foto diam
    photoPreview.src = canvas.toDataURL('image/jpeg');
    photoPreview.style.display = 'block';
    video.style.display = 'none';

    // Konversi ke Base64 untuk dikirim
    const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
    
    const scriptURL = 'https://script.google.com/macros/s/AKfycbxCfbVY0hKIegCpICkUEMFCArl4mv9jmUeiXApiwxXIZFaDL0quJztdp_dkdqzKQlIblQ/exec;

    fetch(scriptURL, {
        method: 'POST',
        body: JSON.stringify({ image: base64Image })
    })
    .then(res => res.json())
    .then(response => {
        if (response.status === "success") {
            document.getElementById('nik').value = response.nik;
            document.getElementById('nama').value = response.nama;
            btn.innerText = "SCAN ULANG";
        } else {
            alert("Gagal membaca: " + response.message);
            btn.innerText = "AMBIL FOTO & PINDAI";
        }
        btn.disabled = false;
        btn.onclick = resetCamera;
    })
    .catch(err => {
        alert("Koneksi Error");
        btn.disabled = false;
    });
}

function resetCamera() {
    video.style.display = 'block';
    photoPreview.style.display = 'none';
    const btn = document.getElementById('btnCapture');
    btn.innerText = "AMBIL FOTO & PINDAI";
    btn.onclick = takePhoto;
}
