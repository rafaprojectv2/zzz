// File: /api/handler.js

// Impor 'node-fetch' untuk melakukan panggilan API dari sisi server
import fetch from 'node-fetch';

// Ini adalah fungsi utama yang akan dijalankan oleh Vercel
export default async function handler(request, response) {
    // Ambil kunci API rahasia dari Environment Variables yang aman
    const AI_API_KEY = process.env.AI_API_KEY_SECRET;
    const AI_BASE_URL = 'https://api.ibeng.my.id/api/ai';

    // Ambil data (prompt & module) yang dikirim dari browser Anda
    const { module, prompt } = request.body;

    if (!prompt || !module) {
        return response.status(400).json({ error: 'Prompt and module are required.' });
    }

    // Buat URL API yang lengkap
    const apiUrl = `${AI_BASE_URL}/${module}?query=${encodeURIComponent(prompt)}&apikey=${AI_API_KEY}`;

    try {
        // Lakukan panggilan ke API eksternal dari server Vercel
        const apiResponse = await fetch(apiUrl);
        const data = await apiResponse.json();

        // Kirim kembali hasil dari API ke browser pengguna
        response.status(200).json(data);

    } catch (error) {
        // Jika terjadi error, kirim pesan error
        response.status(500).json({ error: 'Failed to fetch from external API.' });
    }
}
