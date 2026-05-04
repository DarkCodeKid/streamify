const youtubedl = require('youtube-dl-exec');

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const id = req.query.id || req.url.split('/').pop().split('?')[0];

  if (!id || id === 'stream') {
    return res.status(400).send("No video ID provided");
  }

  try {
    const url = `https://www.youtube.com/watch?v=${id}`;
    
    // Using youtube-dl-exec to stream bestaudio directly to response
    const subprocess = youtubedl.exec(url, {
      f: 'bestaudio',
      o: '-', // output to stdout
      noWarnings: true,
      noCallHome: true,
      noCheckCertificates: true
    }, {
      stdio: ['ignore', 'pipe', 'ignore'] // ignore stdin/stderr, pipe stdout
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");

    subprocess.stdout.pipe(res);

    subprocess.on('error', (err) => {
       console.error("Stream subprocess error:", err);
    });

  } catch (err) {
    console.error("Streaming error for ID", id, ":", err);
    res.status(500).send("Error streaming audio. It might be restricted or blocked.");
  }
};

