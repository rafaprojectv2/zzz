// Cloudflare Worker untuk mengamankan semua endpoint API

export default {
  async fetch(request, env) {
    // Header CORS standar untuk mengizinkan website Anda mengakses worker ini
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Ganti '*' dengan domain Anda untuk keamanan ekstra
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Menangani permintaan pre-flight dari browser
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    let response;
    try {
      const contentType = request.headers.get('Content-Type') || '';

      // Rute 1: Jika permintaan adalah upload gambar (FormData)
      if (contentType.includes('multipart/form-data')) {
        const UPLOAD_URL = `https://fgsi.koyeb.app/api/upload/${env.VEO_API_KEY}`;
        response = await fetch(UPLOAD_URL, {
          method: 'POST',
          body: request.body, // Meneruskan file langsung
        });
      }
      // Rute 2: Jika permintaan adalah aksi JSON (buat video / cek status)
      else if (contentType.includes('application/json')) {
        const payload = await request.json();
        
        if (payload.action === 'create') {
          response = await handleCreateVideo(payload, env);
        } else if (payload.action === 'status') {
          response = await handleCheckStatus(payload, env);
        } else {
          throw new Error('Aksi JSON tidak valid.');
        }
      } else {
        throw new Error('Content-Type tidak didukung.');
      }

      // Buat respons baru agar kita bisa menambahkan header CORS
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
      Object.keys(corsHeaders).forEach(key => newResponse.headers.set(key, corsHeaders[key]));
      return newResponse;

    } catch (error) {
      // Jika terjadi error di dalam worker, kirim respons error sebagai JSON
      const errorResponse = { success: false, error: 'Worker Error', details: error.message };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// Fungsi untuk menangani pembuatan video
async function handleCreateVideo(payload, env) {
  const VEO_API_KEY = env.VEO_API_KEY;
  if (!VEO_API_KEY) throw new Error("Variabel VEO_API_KEY belum diatur di Cloudflare.");

  // 1. Dapatkan token bypass
  const bypassUrl = `https://fgsi.koyeb.app/api/tools/bypasscf/v5?apikey=${encodeURIComponent(VEO_API_KEY)}&url=https://lunaai.video/features/v3-fast&sitekey=0x4AAAAAAAdJZmNxW54o-Gvd&mode=turnstile-min`;
  const bypassResponse = await fetch(bypassUrl);
  const bypassData = await bypassResponse.json();

  if (!bypassResponse.ok || !bypassData.data || !bypassData.data.token) {
    throw new Error(`Bypass gagal: ${bypassData.message || 'Respons tidak valid'}`);
  }
  const token = bypassData.data.token;

  // 2. Kirim permintaan pembuatan video
  const createUrl = "https://aiarticle.erweima.ai/api/v1/secondary-page/api/create";
  const createPayload = {
    'prompt': payload.prompt || '', 'imgUrls': payload.imgUrls || [],
    'quality': payload.quality || '720p', 'model': payload.model || 'veo-3-fast',
    'duration': 8, 'autoSoundFlag': false, 'soundPrompt': "",
    'autoSpeechFlag': false, 'speechPrompt': "", 'speakerId': "Auto",
    'aspectRatio': "16:9", 'secondaryPageId': 1946, 'channel': "VEO3",
    'source': "lunaai.video", 'type': "features", 'watermarkFlag': false,
    'privateFlag': false, 'isTemp': true, 'vipFlag': false,
  };
  const createHeaders = {
    'Content-Type': 'application/json',
    'origin': 'https://lunaai.video',
    'referer': 'https://lunaai.video/',
    'verify': token,
    'uniqueid': btoa(Date.now()),
  };
  
  return fetch(createUrl, {
    method: 'POST',
    headers: createHeaders,
    body: JSON.stringify(createPayload),
  });
}

// Fungsi untuk memeriksa status video
async function handleCheckStatus(payload, env) {
  const recordId = payload.recordId;
  if (!recordId) throw new Error("recordId dibutuhkan untuk memeriksa status.");

  const statusUrl = `https://aiarticle.erweima.ai/api/v1/secondary-page/api/${recordId}`;
  const statusHeaders = {
    'origin': 'https://lunaai.video',
    'referer': 'https://lunaai.video/',
  };

  return fetch(statusUrl, { headers: statusHeaders });
}
