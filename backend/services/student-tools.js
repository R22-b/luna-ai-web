// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const pdfParse = require('pdf-parse');
const { YoutubeTranscript } = require('youtube-transcript');
const { chat } = require('./brain-manager');

function chunkText(text, size = 3000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) chunks.push(text.slice(i, i + size));
  return chunks;
}

async function summarizePDF(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text.replace(/\s+/g, ' ').trim();
  const chunks = chunkText(text);

  const summaries = await Promise.all(chunks.slice(0, 5).map(chunk =>
    chat([{ role: 'user', content: `Summarize this text in 3-4 sentences:\n\n${chunk}` }], 'fast')
      .then(r => r.response)
  ));

  const fullSummary = summaries.join('\n\n');
  const [keyPoints, questions, flashcards] = await Promise.all([
    chat([{ role: 'user', content: `List 8 key points from:\n${fullSummary}` }], 'fast').then(r => r.response),
    chat([{ role: 'user', content: `Generate 5 study questions from:\n${fullSummary}` }], 'fast').then(r => r.response),
    chat([{ role: 'user', content: `Create 8 flashcards as JSON array [{q,a}] from:\n${fullSummary}. Return ONLY JSON.` }], 'fast')
      .then(r => { try { return JSON.parse(r.response.match(/\[[\s\S]*\]/)[0]); } catch { return []; } }),
  ]);

  return { summary: fullSummary, keyPoints, questions, flashcards, pageCount: data.numpages };
}

async function processYouTube(url) {
  const videoId = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
  if (!videoId) throw new Error('Invalid YouTube URL');

  const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
  const transcript = transcriptItems.map(t => t.text).join(' ');
  const chunks = chunkText(transcript);

  const summaries = await Promise.all(chunks.slice(0, 4).map(chunk =>
    chat([{ role: 'user', content: `Summarize this video transcript section:\n\n${chunk}` }], 'fast')
      .then(r => r.response)
  ));

  const fullSummary = summaries.join('\n\n');
  const [notes, questions] = await Promise.all([
    chat([{ role: 'user', content: `Create structured study notes with headers from:\n${fullSummary}` }], 'fast').then(r => r.response),
    chat([{ role: 'user', content: `Generate 5 quiz questions from:\n${fullSummary}` }], 'fast').then(r => r.response),
  ]);

  return { videoId, summary: fullSummary, notes, questions, transcriptLength: transcript.length };
}

async function feynmanExplain(topic) {
  const result = await chat([{
    role: 'user',
    content: `Explain "${topic}" using the Feynman technique:
1. Explain it simply like I'm 12 years old
2. Use an analogy from everyday life
3. Give a real-world example
4. Point out the most important thing to remember

Be friendly, clear and engaging. Avoid jargon.`,
  }], 'chat');
  return result.response;
}

async function generateFlashcards(topic) {
  const result = await chat([{
    role: 'user',
    content: `Generate 12 flashcards about "${topic}".
Return ONLY a valid JSON array like this:
[{"q": "Question here?", "a": "Answer here."}]
No other text, just the JSON array.`,
  }], 'fast');
  try {
    const match = result.response.match(/\[[\s\S]*\]/);
    return JSON.parse(match[0]);
  } catch {
    return [{ q: `What is ${topic}?`, a: result.response }];
  }
}

async function generateQuiz(topic) {
  const result = await chat([{
    role: 'user',
    content: `Generate 10 multiple choice questions about "${topic}".
Return ONLY valid JSON array:
[{"question":"Q?","options":["A","B","C","D"],"answer":"A","explanation":"Why A is correct"}]
No other text.`,
  }], 'chat');
  try {
    const match = result.response.match(/\[[\s\S]*\]/);
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

async function summarizeLink(url) {
  const fetch = require('node-fetch');
  const cheerio = require('cheerio');
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
  const html = await res.text();
  const $ = cheerio.load(html);
  $('script,style,nav,footer,header').remove();
  const text = $('article,main,body').first().text().replace(/\s+/g, ' ').trim().substring(0, 4000);
  const result = await chat([{ role: 'user', content: `Summarize this article in bullet points:\n\n${text}` }], 'fast');
  return result.response;
}

module.exports = { summarizePDF, processYouTube, feynmanExplain, generateFlashcards, generateQuiz, summarizeLink };
