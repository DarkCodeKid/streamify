const express = require("express");
const cors = require("cors");
const search = require("youtube-search-api");
const YTDlpWrap = require("yt-dlp-wrap").default;

const app = express();
app.use(cors());

const ytDlp = new YTDlpWrap("./yt-dlp.exe");

// 🔎 SEARCH
app.get("/search", async (req, res) => {
  const query = req.query.q;

  try {
    const result = await search.GetListByKeyword(query, false, 10);

    const songs = result.items.map(item => ({
      title: item.title,
      id: item.id,
      thumbnail: item.thumbnail.thumbnails[0].url
    }));

    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).send("Search error");
  }
});

// 🎧 STREAM (SUPER STABLE)
app.get("/stream/:id", async (req, res) => {
  const id = req.params.id;
  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    const stream = ytDlp.execStream([
      url,
      "-f", "bestaudio",
      "-o", "-"
    ]);

    res.setHeader("Content-Type", "audio/mpeg");

    stream.pipe(res);

  } catch (err) {
    console.error(err);
    res.status(500).send("Streaming error");
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});