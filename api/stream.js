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
    
    // Get stream from play-dl
    const stream = await play.stream(url, {
        quality: 0, // bestaudio
        discordPlayerCompatibility: true // Helps with some headers
    });

    res.setHeader("Content-Type", "audio/mpeg");
    // res.setHeader("Content-Length", ...); // Optional, play-dl doesn't always provide it easily

    stream.stream.pipe(res);

  } catch (err) {
    console.error("Streaming error:", err);
    res.status(500).send("Error streaming audio: " + err.message);
  }
};
