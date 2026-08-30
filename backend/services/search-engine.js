// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const fetch = require('node-fetch');
const cheerio = require('cheerio');
require('dotenv').config();
const settings = require('./settings-store');

async function searchSerper(query, num = 5) {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': settings.getKey('SERPER_API_KEY'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num }),
  });
  if (!res.ok) throw new Error('Serper failed');
  const data = await res.json();
  return (data.organic || []).map(r => ({ title: r.title, url: r.link, snippet: r.snippet }));
}

async function searchBrave(query, num = 5) {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${num}`,
    { headers: { 'Accept': 'application/json', 'X-Subscription-Token': settings.getKey('BRAVE_API_KEY') } }
  );
  if (!res.ok) throw new Error('Brave failed');
  const data = await res.json();
  return (data.web?.results || []).map(r => ({ title: r.title, url: r.url, snippet: r.description }));
}

async function searchDuckDuckGo(query) {
  const res = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
  );
  if (!res.ok) throw new Error('DDG failed');
  const data = await res.json();
  const results = [];
  if (data.AbstractText) results.push({ title: data.Heading, url: data.AbstractURL, snippet: data.AbstractText });
  (data.RelatedTopics || []).slice(0, 4).forEach(t => {
    if (t.Text) results.push({ title: t.Text.substring(0, 60), url: t.FirstURL, snippet: t.Text });
  });
  return results;
}

async function fetchPageContent(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LunaAIBot/1.0)' },
      timeout: 5000,
    });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, aside, .ads, #ads, .advertisement').remove();
    const text = $('article, main, .content, .post, body').first().text()
      .replace(/\s+/g, ' ').trim().substring(0, 3000);
    return text || null;
  } catch {
    return null;
  }
}

async function search(query, numResults = 5) {
  let results = [];
  // Try providers in order
  if (settings.getKey('SERPER_API_KEY')) {
    try { results = await searchSerper(query, numResults); } catch (e) { console.warn('Serper failed:', e.message); }
  }
  if (!results.length && settings.getKey('BRAVE_API_KEY')) {
    try { results = await searchBrave(query, numResults); } catch (e) { console.warn('Brave failed:', e.message); }
  }
  if (!results.length) {
    try { results = await searchDuckDuckGo(query); } catch (e) { console.warn('DDG failed:', e.message); }
  }
  // Fetch page content for top results
  const enriched = await Promise.all(
    results.slice(0, numResults).map(async r => ({
      ...r,
      content: await fetchPageContent(r.url),
    }))
  );
  return enriched.filter(r => r.snippet || r.content);
}

module.exports = { search, fetchPageContent };
