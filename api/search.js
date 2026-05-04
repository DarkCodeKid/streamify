const search = require("youtube-search-api");

module.exports = async (req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: "Query parameter 'q' is required" });
  }

  try {
    const result = await search.GetListByKeyword(q, false, 10);
    const songs = result.items.map(item => ({
      title: item.title,
      id: item.id,
      thumbnail: item.thumbnail?.thumbnails?.[0]?.url || ""
    }));

    res.status(200).json(songs);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Failed to search songs" });
  }
};
