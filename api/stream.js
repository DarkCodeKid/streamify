const play = require("play-dl");

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Support both /api/stream?id=XXX and /api/stream/XXX (if routed)
  // Vercel usually passes params if configured, but query is safer default
  const id = req.query.id || req.url.split('/').pop().split('?')[0];

  if (!id || id === 'stream') {
    return res.status(400).send("No video ID provided");
  }

  try {
    const url = `https://www.youtube.com/watch?v=${id}`;
    
    // Get stream from play-dl with improved settings
    const stream = await play.stream(url, {
        quality: 0, 
        discordPlayerCompatibility: true,
        // Using a more standard UA can help bypass some blocks
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    });

    res.setHeader("Content-Type", stream.type || "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");

    stream.stream.pipe(res);

  } catch (err) {
    console.error("Streaming error for ID", id, ":", err);
    res.status(500).send("Error streaming audio. It might be restricted or blocked.");
  }

};
