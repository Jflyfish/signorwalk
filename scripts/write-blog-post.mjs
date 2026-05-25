/**
 * Blog post generator for Sign or Walk
 *
 * Usage:
 *   node scripts/write-blog-post.mjs "your topic here"
 *
 * Requires:
 *   ANTHROPIC_API_KEY    — in .env.local or your shell environment
 *   UNSPLASH_ACCESS_KEY  — optional, from unsplash.com/developers (free)
 *
 * What it does:
 *   1. Calls Claude to write a structured, SEO-optimised, consumer-friendly post
 *   2. Fetches 2 relevant free Unsplash stock photos (skips if no key set)
 *   3. First image is always the hero at the top; second goes mid-article
 *   4. Generates the TSX Content component
 *   5. Appends the new post to src/lib/blogPosts.tsx
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env.local') });

const topic = process.argv[2];
if (!topic) {
  console.error('Usage: node scripts/write-blog-post.mjs "your topic"');
  process.exit(1);
}

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
const TODAY = new Date().toISOString().split('T')[0];

if (!ANTHROPIC_API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in environment');
  process.exit(1);
}

// ── 1. Fetch Unsplash images ──────────────────────────────────────────────────

async function fetchImages(query, count = 2) {
  if (!UNSPLASH_KEY) {
    console.log('ℹ️  No UNSPLASH_ACCESS_KEY set — skipping images');
    return [];
  }
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape&client_id=${UNSPLASH_KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
    const data = await res.json();
    return data.results.map(photo => ({
      src: photo.urls.regular,
      alt: photo.alt_description || query,
      credit: photo.user.name,
      creditUrl: `${photo.user.links.html}?utm_source=sign_or_walk&utm_medium=referral`,
    }));
  } catch (err) {
    console.warn('⚠️  Could not fetch Unsplash images:', err.message);
    return [];
  }
}

// ── 2. Generate post content via Claude ──────────────────────────────────────

async function generatePost(topic, images) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  // Image 0 is the hero (always at top), image 1+ go mid-article via image_slot
  const midArticleImages = images.length > 1 ? images.length - 1 : 0;

  const system = `You are a senior automotive journalist writing for Sign or Walk, a free AI car deal grader.
Your job is to write blog posts that help everyday car buyers make smarter decisions.

RULES — follow every one, no exceptions:
1. TRUTHFUL: Every claim must be factually accurate. Do not invent statistics, rates, or data. If you reference a number (e.g. average doc fee), only use it if it is a well-known industry fact. When uncertain, use ranges and say "typically" or "often."
2. ACTIONABLE: Every section should leave the reader knowing what to do next. Avoid vague advice like "do your research." Give specific steps a normal person can take today.
3. SEO OPTIMISED: Include the primary keyword naturally in the title, first paragraph, at least one H2, and the conclusion. Write a meta-description-length excerpt (150 to 160 chars). Use clear H2s that match common search queries. Aim for 600 to 900 words of body content.
4. ENGAGING: Write in a confident, direct, insider voice. Like a knowledgeable friend, not a financial advisor. Short sentences. No jargon without explanation. Occasional rhetorical questions are fine.
5. NO DASHES: Never use em dashes (—) or en dashes (–) anywhere in the text. Rewrite any sentence that would use one. Use a period, a comma, or restructure the sentence instead.
6. NEVER SOUND LIKE AI: Write the way a sharp, experienced person would talk. Avoid these words and phrases entirely: "dive into", "delve", "leverage" (as a verb), "ensure", "utilize", "furthermore", "moreover", "it is worth noting", "it is important to note", "in conclusion", "additionally" at the start of a sentence, "navigate", "crucial", "pivotal", "landscape" (as a metaphor). Never start consecutive sentences with the same word. Vary sentence length. Use contractions naturally.
7. EXTREMELY READABLE: Write for a 8th grade reading level. Short paragraphs, three sentences max. One idea per paragraph. If a sentence runs longer than 20 words, split it. Use plain words over fancy ones every time. No walls of text. If you catch yourself writing a long explanation, stop and ask: can this be a list instead?

Return ONLY valid JSON. No markdown, no code fences, no commentary before or after.`;

  const userPrompt = `Write a blog post for this topic: "${topic}"

Return this exact JSON structure:
{
  "slug": "kebab-case-url-slug",
  "title": "SEO-friendly title (60 chars max)",
  "excerpt": "150 to 160 char excerpt for meta description and listing card",
  "readTime": "X min read",
  "sections": [
    { "type": "intro", "content": "Opening paragraph. Hook the reader, state the problem, include primary keyword." },
    { "type": "h2", "content": "Section heading" },
    { "type": "paragraph", "content": "Body paragraph" },
    { "type": "list", "items": ["Actionable item 1", "Actionable item 2", "Actionable item 3"] },
    { "type": "image_slot" },
    { "type": "h2", "content": "Another section" },
    { "type": "paragraph", "content": "More body" },
    { "type": "h2", "content": "What to do next" },
    { "type": "paragraph", "content": "Actionable conclusion that ties back to the primary keyword" }
  ]
}

Rules for sections:
- Include exactly ${midArticleImages} "image_slot" entries for mid-article images (not at the top — the hero is handled separately).
- Every list item must be a specific, actionable tip. No filler.
- No em dashes or en dashes anywhere in any string.`;

  console.log('✍️  Writing post with Claude…');
  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 2048,
    messages: [{ role: 'user', content: userPrompt }],
    system,
  });

  const raw = message.content[0].text.trim();
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleaned);
  }
}

// ── 3. Build the TSX Content component string ─────────────────────────────────

function escapeJsx(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/—/g, '')      // strip any em dashes that slipped through
    .replace(/–/g, '')      // strip en dashes
    .replace(/'/g, '&apos;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function imageBlock(img, rounded = true) {
  const cls = rounded
    ? 'w-full rounded-xl object-cover max-h-64'
    : 'w-full object-cover max-h-80 rounded-xl';
  return [
    '        <figure>',
    `          <img src="${img.src}&w=900&q=75" alt="${escapeJsx(img.alt)}" className="${cls}" />`,
    `          <figcaption className="text-xs text-gray-400 mt-1.5 text-center">Photo by <a href="${img.creditUrl}" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">${escapeJsx(img.credit)}</a> on <a href="https://unsplash.com?utm_source=sign_or_walk&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">Unsplash</a></figcaption>`,
    '        </figure>',
  ].join('\n');
}

function buildContentComponent(sections, images) {
  // images[0] is the hero — rendered first, before sections
  // images[1+] fill image_slots mid-article
  let midIndex = 1;
  const lines = [];

  lines.push('      <div className="space-y-6">');

  // Hero image
  if (images[0]) {
    lines.push(imageBlock(images[0], true));
  }

  for (const section of sections) {
    if (section.type === 'intro') {
      lines.push(`        <p className="text-lg sm:text-xl text-gray-800 leading-relaxed font-medium">${escapeJsx(section.content)}</p>`);
    } else if (section.type === 'paragraph') {
      lines.push(`        <p className="text-base sm:text-lg text-gray-700 leading-loose">${escapeJsx(section.content)}</p>`);
    } else if (section.type === 'h2') {
      lines.push(`        <h2 className="text-2xl font-bold text-gray-900 pt-4">${escapeJsx(section.content)}</h2>`);
    } else if (section.type === 'list') {
      lines.push('        <ul className="space-y-3 pl-1">');
      for (const item of section.items) {
        lines.push(`          <li className="flex items-start gap-3 text-base sm:text-lg text-gray-700 leading-relaxed"><span className="text-blue-500 font-bold mt-1 flex-shrink-0">→</span><span>${escapeJsx(item)}</span></li>`);
      }
      lines.push('        </ul>');
    } else if (section.type === 'image_slot') {
      const img = images[midIndex];
      if (img) {
        lines.push(imageBlock(img, true));
        midIndex++;
      }
    }
  }

  lines.push('      </div>');
  return lines.join('\n');
}

// ── 4. Append to blogPosts.tsx ────────────────────────────────────────────────

function appendToPostsFile(post, sections, images) {
  const filePath = path.resolve(__dirname, '../src/lib/blogPosts.tsx');
  let source = fs.readFileSync(filePath, 'utf8');

  const contentJsx = buildContentComponent(sections, images);

  const newEntry = `  {
    slug: '${post.slug}',
    title: '${post.title.replace(/'/g, "\\'")}',
    date: '${TODAY}',
    excerpt: '${post.excerpt.replace(/'/g, "\\'")}',
    readTime: '${post.readTime}',
    Content: () => (
${contentJsx}
    ),
  },`;

  const insertPoint = source.lastIndexOf('];');
  if (insertPoint === -1) {
    console.error('Could not find closing ]; in blogPosts.tsx');
    process.exit(1);
  }

  source = source.slice(0, insertPoint) + newEntry + '\n' + source.slice(insertPoint);
  fs.writeFileSync(filePath, source, 'utf8');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚗 Generating blog post for: "${topic}"\n`);

  const imageQuery = topic.length < 40 ? topic : topic.split(' ').slice(0, 4).join(' ');
  const images = await fetchImages(`${imageQuery} car`, 2);
  if (images.length) console.log(`📸 Found ${images.length} stock photo(s) (first = hero)`);

  const post = await generatePost(topic, images);
  console.log(`✅ Title: ${post.title}`);
  console.log(`   Slug:  ${post.slug}`);
  console.log(`   Time:  ${post.readTime}`);

  appendToPostsFile(post, post.sections, images);
  console.log(`\n✅ Post added to src/lib/blogPosts.tsx`);
  console.log(`   Preview: http://localhost:3001/blog/${post.slug}\n`);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
