/**
 * API Vercel: retorna post.html com meta tags (og:image, og:title, og:description)
 * preenchidas com os dados do artigo no Supabase, para cada post.
 * Assim crawlers (Facebook, etc.) veem a imagem e o título do artigo, não do blog.
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qrjmvqedoypxmnvfdetg.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFyam12cWVkb3lweG1udmZkZXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDc3MjYsImV4cCI6MjA3OTIyMzcyNn0.QjhD8GQsNiNX58EvVUJvf9seNYGR6ruLvpF1lHpSX8E';
const DEFAULT_IMAGE = 'https://www.blogvida360.com.br/assets/images/og-banner.png';

/** Domínio canônico do site (OG e caminhos relativos); evita preview URL da Vercel nas meta tags. */
function canonicalSiteBase() {
  const fromEnv = process.env.PUBLIC_SITE_URL || process.env.SITE_URL;
  if (fromEnv) {
    return String(fromEnv)
      .trim()
      .replace(/\/$/, '')
      .replace(/^http:\/\//i, 'https://');
  }
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prod) return 'https://' + String(prod).replace(/^https?:\/\//, '');
  return 'https://www.blogvida360.com.br';
}

/**
 * Facebook e outros crawlers exigem URL HTTP(S) pública. data:/blob: não são aceitos em og:image.
 */
function resolveOgImage(raw, siteBase) {
  const img = (raw && String(raw).trim()) || '';
  if (!img) return DEFAULT_IMAGE;
  if (/^data:/i.test(img) || /^blob:/i.test(img)) return DEFAULT_IMAGE;
  if (img.startsWith('http://') || img.startsWith('https://')) return img;
  return img.startsWith('/') ? siteBase + img : siteBase + '/' + img;
}

/**
 * Facebook exige imagem acessível e leve; URLs Unsplash sem parâmetros podem apontar para ficheiros enormes (>5MB),
 * o que faz o crawler desistir. Imgix aceita w/h/fit para pré-visualização estável.
 */
function optimizeOgImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const s = url.trim();
  if (!s.startsWith('http')) return s;
  try {
    const u = new URL(s);
    if (u.hostname === 'images.unsplash.com' || u.hostname === 'unsplash.com') {
      if (!u.searchParams.has('w')) {
        u.searchParams.set('w', '1200');
        u.searchParams.set('h', '630');
        u.searchParams.set('fit', 'crop');
        u.searchParams.set('auto', 'format');
        u.searchParams.set('q', '85');
      }
      return u.toString();
    }
  } catch (e) {
    /* manter URL original */
  }
  return s;
}

function loadTemplate() {
  const templatePath = path.join(__dirname, 'post-template.html');
  try {
    return fs.readFileSync(templatePath, 'utf8');
  } catch (e) {
    console.error('post-template.html não encontrado. Rode npm run build.', e);
    return null;
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchPost(slug) {
  /** `select=*` garante colunas antigas/alternativas (ex.: image_url) para og:image */
  const url = `${SUPABASE_URL}/rest/v1/blog360_posts?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const row = Array.isArray(data) && data.length ? data[0] : null;
  if (!row) return null;
  const isPublished = row.status === 'published' || row.publicado === true || row.published_at;
  return isPublished ? row : null;
}

/** Primeira URL de imagem encontrada no markdown/HTML do corpo (fallback para OG). */
function extractFirstImageUrlFromBody(text) {
  if (!text) return '';
  const s = String(text);
  const md = s.match(/!\[[^\]]*\]\((https?:[^)\s]+)\)/i);
  if (md) return md[1].trim();
  const mdBare = s.match(/\]\((https?:[^)\s]+\.(?:png|jpe?g|webp|gif)(?:\?[^)]*)?)\)/i);
  if (mdBare) return mdBare[1].trim();
  const imgTag = s.match(/<img[^>]+src=["'](https?:[^"']+)["']/i);
  if (imgTag) return imgTag[1].trim();
  const loose = s.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s"'<>]*)?/i);
  return loose ? loose[0].trim() : '';
}

/** Ordem: redes sociais → destaque → nomes legados → 1.ª imagem no texto */
function pickRawOgImage(post) {
  if (!post || typeof post !== 'object') return '';
  const keys = [
    'imagem_social_url',
    'imagem_destaque',
    'image_url',
    'featured_image',
    'cover_image',
    'og_image',
    'thumbnail_url',
    'thumb_url',
  ];
  for (let i = 0; i < keys.length; i++) {
    const v = post[keys[i]];
    const t = v && String(v).trim();
    if (t) return t;
  }
  const body = post.conteudo || post.content || post.conteudo_markdown || '';
  return extractFirstImageUrlFromBody(body);
}

function applyMeta(html, meta) {
  const rawImage = optimizeOgImageUrl(meta.image);
  const imgEsc = escapeHtml(rawImage);
  const urlEsc = escapeHtml(meta.url);
  let out = html;
  out = out.replace(/___OG_TITLE___/g, escapeHtml(meta.title));
  out = out.replace(/___OG_DESCRIPTION___/g, escapeHtml(meta.description));
  out = out.replace(/___OG_IMAGE___/g, imgEsc);
  out = out.replace(/___OG_IMAGE_ALT___/g, escapeHtml(meta.title));
  out = out.replace(/___OG_URL___/g, urlEsc);
  if (rawImage && String(rawImage).startsWith('https://')) {
    out = out.replace('</head>', `    <meta property="og:image:secure_url" content="${imgEsc}">\n</head>`);
  }
  return out;
}

module.exports = async (req, res) => {
  const slug = (req.query && req.query.post) || '';
  const siteBase = canonicalSiteBase();
  const postUrl = slug
    ? `${siteBase}/post.html?post=${encodeURIComponent(slug)}`
    : `${siteBase}/post.html`;

  let meta = {
    title: 'Vida 360º - Blog',
    description: 'Conteúdos exclusivos sobre saúde, bem-estar, produtividade, mentalidade e equilíbrio',
    image: DEFAULT_IMAGE,
    url: postUrl,
  };

  if (slug) {
    const post = await fetchPost(slug);
    if (post) {
      const rawOg = pickRawOgImage(post);
      const img = resolveOgImage(rawOg, siteBase);
      let desc = (post.resumo || post.excerpt || '').trim();
      if (desc.length > 200) desc = desc.substring(0, 197) + '...';
      if (!desc) desc = 'Leia este artigo no Blog Vida 360º';
      meta = {
        title: (post.titulo || post.title || 'Post').trim(),
        description: desc,
        image: img,
        url: postUrl,
      };
    }
  }

  const template = loadTemplate();
  if (!template) {
    res.status(500).send('Template não disponível. Execute npm run build.');
    return;
  }

  const html = applyMeta(template, meta);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  /** HTML com OG por post: revalidar mais cedo para redes não ficarem no banner genérico em cache */
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  res.status(200).send(html);
};
