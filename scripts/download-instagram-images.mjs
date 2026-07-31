#!/usr/bin/env node

/**
 * Downloads Instagram post images for local hosting.
 *
 * Instagram CDN URLs expire, so this script fetches the embed page
 * for each post and extracts the current image URL, then downloads it.
 *
 * Usage: node scripts/download-instagram-images.mjs
 */

import { writeFile, mkdir } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const OUTPUT_DIR = join(process.cwd(), "public/images/instagram");

/*
 * The list comes from this site's own content. It used to be 24 hardcoded
 * shortcodes with filenames — the reference build's feed — so running the script
 * in a client repo downloaded another person's photographs into their public/.
 *
 * `image` is the path the site renders ("/images/instagram/foo.jpg"); the
 * filename is its basename, so the two can never drift apart.
 */
const content = JSON.parse(
  readFileSync(join(process.cwd(), "src/data/influencer.json"), "utf8"),
);
const posts = (content.posts ?? [])
  .filter((p) => p.shortcode && p.image)
  .map((p) => ({ shortcode: p.shortcode, filename: p.image.split("/").pop() }));

if (posts.length === 0) {
  console.log("No Instagram posts in src/data/influencer.json — nothing to download.");
  process.exit(0);
}


async function extractImageUrl(shortcode) {
  const embedUrl = `https://www.instagram.com/p/${shortcode}/embed/captioned/`;
  const res = await fetch(embedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "text/html",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch embed for ${shortcode}: ${res.status}`);
  }

  const html = await res.text();

  // Extract the main display image URL from the embed HTML
  // Look for the EmbeddedMediaImage class or display_url in the JSON data
  const patterns = [
    /class="EmbeddedMediaImage"[^>]*src="([^"]+)"/,
    /"display_url":"([^"]+)"/,
    /src="(https:\/\/scontent[^"]+)"/,
    /"thumbnail_src":"([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].replace(/&amp;/g, "&").replace(/\\u0026/g, "&").replace(/\\/g, "");
    }
  }

  throw new Error(`No image URL found for ${shortcode}`);
}

async function downloadImage(url, filepath) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      Referer: "https://www.instagram.com/",
      Origin: "https://www.instagram.com",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to download image: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  await writeFile(filepath, buffer);
  return buffer.length;
}

async function main() {
  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}`);
  }

  console.log(`\nDownloading ${posts.length} Instagram images...\n`);

  let success = 0;
  let failed = 0;

  for (const post of posts) {
    const filepath = join(OUTPUT_DIR, post.filename);

    if (existsSync(filepath)) {
      console.log(`  SKIP  ${post.filename} (already exists)`);
      success++;
      continue;
    }

    try {
      process.stdout.write(`  FETCH ${post.shortcode} ...`);
      const imageUrl = await extractImageUrl(post.shortcode);

      process.stdout.write(` downloading ...`);
      const bytes = await downloadImage(imageUrl, filepath);

      console.log(` OK (${(bytes / 1024).toFixed(0)}KB) → ${post.filename}`);
      success++;
    } catch (err) {
      console.log(` FAIL: ${err.message}`);
      failed++;
    }

    // Rate limit — be polite to Instagram
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nDone: ${success} downloaded, ${failed} failed.`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
}

main().catch(console.error);
