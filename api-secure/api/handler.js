// File: /api/handler.js

// Impor 'node-fetch' untuk melakukan panggilan API dari sisi server
import fetch from 'node-fetch';

// --- Fungsi Penting untuk Memberikan Izin CORS ---
// Fungsi ini akan menambahkan header yang diperlukan ke setiap respons.
const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    // Izinkan akses dari domain manapun. Untuk keamanan lebih, ganti '*' dengan domain Anda,
    // contoh: 'https://domain-website-anda.com'
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );
    // Browser akan mengirim permintaan 'OPTIONS' terlebih dahulu (preflight)
    // Kita harus menanggapinya dengan status OK.
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    return await fn(req, res);
};

// --- Fungsi Handler Utama Anda ---
async function handler(request, response) {
    // Ambil kunci API rahasia dari Environment Variables yang aman
    const AI_API_KEY = process.env.AI_API_KEY_SECRET;
    const AI_BASE_URL = 'https://api.ibeng.my.id/api/ai';
    
    // Vercel secara otomatis mem-parsing body untuk permintaan POST
    const { module, prompt } = request.body;

    if (!prompt || !module) {
        return response.status(400).json({ error: 'Prompt and module are required.' });
    }

    // Buat URL API yang lengkap
    const apiUrl = `${AI_BASE_URL}/${module}?query=${encodeURIComponent(prompt)}&apikey=${AI_API_KEY}`;

    try {
        // Lakukan panggilan ke API eksternal dari server Vercel
        const apiResponse = await fetch(apiUrl);
        
        // Periksa apakah respons dari API eksternal valid
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            // Teruskan status dan pesan error dari API eksternal
            return response.status(apiResponse.status).json({ error: 'External API Error', details: errorText });
        }

        const data = await apiResponse.json();
        
        // Kirim kembali hasil dari API ke browser pengguna
        response.status(200).json(data);

    } catch (error) {
        // Jika terjadi error, kirim pesan error
        response.status(500).json({ error: 'Failed to fetch from external API.', details: error.message });
    }
}

// --- Ekspor Handler ---
// Kita "membungkus" fungsi handler utama kita dengan fungsi allowCors.
export default allowCors(handler);
