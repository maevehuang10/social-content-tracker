import { readFile, writeFile } from "node:fs/promises";

const SOURCES = [
  { name: "CNX Software", url: "https://www.cnx-software.com/feed/" },
  { name: "IoT Now", url: "https://iot-now.com/feed/" },
  { name: "IoT Tech News", url: "https://iottechnews.com/feed/" }
];

const MAX_TOPICS = 24;
const MAX_SOURCE_ITEMS = 12;

const productRules = [
  {
    product: "Radar Sensor",
    tags: ["Radar", "Presence Detection", "Smart Sensing"],
    keywords: ["radar", "mmwave", "millimeter", "presence detection", "occupancy"]
  },
  {
    product: "LoRa Module",
    tags: ["LoRa", "LPWAN", "Smart City"],
    keywords: ["lora", "lorawan", "lpwan"]
  },
  {
    product: "UWB Module",
    tags: ["UWB", "RTLS", "Positioning"],
    keywords: ["uwb", "ultra wideband", "rtls", "precise positioning"]
  },
  {
    product: "BLE Module",
    tags: ["BLE", "Bluetooth", "Positioning"],
    keywords: ["bluetooth", "ble", "channel sounding"]
  },
  {
    product: "WiFi Module",
    tags: ["WiFi", "Smart Home", "Wireless Module"],
    keywords: ["wi-fi", "wifi", "wi fi", "halow", "matter", "smart home"]
  },
  {
    product: "Cellular IoT Module",
    tags: ["NB-IoT", "Cat.1", "Cellular IoT"],
    keywords: ["nb-iot", "cat.1", "cat-1", "cellular", "lte", "5g", "satellite"]
  },
  {
    product: "ESP32 Module",
    tags: ["ESP32", "Embedded Development", "Smart Device"],
    keywords: ["esp32", "microcontroller", "mcu", "embedded"]
  }
];

function decodeHtml(text) {
  return text
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtml(text) {
  return decodeHtml(text.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function truncateText(text, maxLength = 260) {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).replace(/\s+\S*$/, "").trim() + "...";
}

function readTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function readLink(block) {
  const rssLink = readTag(block, "link");
  if (rssLink) return rssLink;
  const atomLink = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  return atomLink ? decodeHtml(atomLink[1]) : "";
}

function parseFeed(xml, sourceName) {
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
  return itemBlocks.slice(0, MAX_SOURCE_ITEMS).map(block => {
    const title = readTag(block, "title");
    const description = readTag(block, "description") || readTag(block, "summary") || readTag(block, "content:encoded");
    const pubDate = readTag(block, "pubDate") || readTag(block, "published") || readTag(block, "updated");
    const date = pubDate ? new Date(pubDate) : new Date();

    return {
      title,
      source: sourceName,
      url: readLink(block),
      description,
      date: Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10)
    };
  }).filter(item => item.title && item.url);
}

async function fetchSource(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { "User-Agent": "Social Content Tracker/1.0" }
    });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return parseFeed(await res.text(), source.name);
  } finally {
    clearTimeout(timer);
  }
}

function classify(item) {
  const haystack = `${item.title} ${item.description}`.toLowerCase();
  const matched = productRules.find(rule => rule.keywords.some(keyword => haystack.includes(keyword)));

  if (matched) return matched;
  return {
    product: "IoT Industry",
    tags: ["IoT", "Industry Trend", "Wireless Technology"],
    keywords: []
  };
}

function scoreTopic(item, rule) {
  let score = 70;
  const text = `${item.title} ${item.description}`.toLowerCase();

  score += rule.product === "IoT Industry" ? 0 : 10;
  if (/module|chip|sensor|device|hardware|gateway/.test(text)) score += 8;
  if (/launch|release|announce|roadmap|standard|certification/.test(text)) score += 6;
  if (/smart home|industrial|factory|agriculture|logistics|asset|meter/.test(text)) score += 5;
  if (/security|privacy|low power|long range|positioning|presence/.test(text)) score += 4;

  return Math.min(score, 98);
}

function formatsFor(rule, item) {
  const formats = new Set(["LinkedIn Post", "Sales Material"]);
  const text = `${item.title} ${item.description}`.toLowerCase();
  if (/radar|bluetooth|lora|uwb|smart home|agriculture|factory|positioning/.test(text)) formats.add("Short Video");
  if (/standard|roadmap|matter|lorawan|bluetooth|trend/.test(text)) formats.add("Carousel");
  return [...formats];
}

function platformsFor(formats) {
  const platforms = new Set(["LinkedIn", "Facebook"]);
  if (formats.includes("Short Video")) {
    platforms.add("TikTok");
    platforms.add("YouTube");
  }
  return [...platforms];
}

function valueFor(rule, item) {
  const scenario = {
    "Radar Sensor": "privacy-friendly sensing, elderly care, smart bathrooms, security, and presence detection",
    "LoRa Module": "smart city, utility metering, asset tracking, and low-power wide-area IoT scenarios",
    "UWB Module": "precise indoor positioning, factory tracking, logistics, and RTLS projects",
    "BLE Module": "proximity, access control, indoor positioning, beacons, and compact connected devices",
    "WiFi Module": "smart home devices, gateways, control panels, and Wi-Fi connected IoT products",
    "Cellular IoT Module": "remote monitoring, logistics, global coverage, and wide-area connected devices",
    "ESP32 Module": "embedded control, smart devices, fast prototyping, and connected product development",
    "IoT Industry": "market education, B2B trend posts, sales context, and social content planning"
  }[rule.product];

  return `Useful for turning current industry news into content about ${scenario}.`;
}

function hookFor(rule, item) {
  const hooks = {
    "Radar Sensor": "Not every sensing solution needs a camera.",
    "LoRa Module": "Some IoT projects need years of battery life, not more bandwidth.",
    "UWB Module": "When meter-level location is not enough, UWB becomes interesting.",
    "BLE Module": "Bluetooth is moving beyond basic connectivity.",
    "WiFi Module": "Wi-Fi modules are still evolving for real IoT deployment needs.",
    "Cellular IoT Module": "Wide-area IoT starts with the right connectivity choice.",
    "ESP32 Module": "A small module can shape the whole connected product experience.",
    "IoT Industry": "Good IoT content starts with useful market context."
  };
  return hooks[rule.product] || hooks["IoT Industry"];
}

function postFor(rule, item) {
  return `${item.title}\n\nThis is a useful signal for IoT brands and product teams watching ${rule.product} opportunities.\n\nFor overseas social content, the story can focus on customer use cases, deployment value, and how module selection affects real product development.\n\nSource: ${item.source}`;
}

function summaryFor(item) {
  return truncateText(item.description || item.title);
}

function toTopic(item) {
  const rule = classify(item);
  const formats = formatsFor(rule, item);

  return {
    title: item.title,
    source: item.source,
    date: item.date,
    product: rule.product,
    score: scoreTopic(item, rule),
    formats,
    platforms: platformsFor(formats),
    tags: rule.tags,
    value: valueFor(rule, item),
    summary: summaryFor(item),
    hook: hookFor(rule, item),
    post: postFor(rule, item),
    url: item.url
  };
}

function withSummary(topic) {
  if (topic.summary) return topic;
  const fallback = topic.post || topic.value || topic.title || "";
  return {
    ...topic,
    summary: truncateText(fallback.split(/\n{2,}/)[0] || fallback)
  };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${item.title.toLowerCase().replace(/\W+/g, " ").trim()}|${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readExistingTopics() {
  try {
    const existing = JSON.parse(await readFile("topics.json", "utf8"));
    return Array.isArray(existing.topics) ? existing.topics : [];
  } catch {
    return [];
  }
}

async function main() {
  const fetched = [];

  for (const source of SOURCES) {
    try {
      const items = await fetchSource(source);
      console.log(`${source.name}: ${items.length} items`);
      fetched.push(...items);
    } catch (error) {
      console.warn(`${source.name}: ${error.message}`);
    }
  }

  const topics = dedupe(fetched)
    .map(toTopic)
    .sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      return dateDiff || b.score - a.score;
    })
    .slice(0, MAX_TOPICS);

  const finalTopics = (topics.length > 0 ? topics : await readExistingTopics()).map(withSummary);

  if (finalTopics.length === 0) {
    throw new Error("No topics fetched and no existing topics.json fallback found.");
  }

  await writeFile("topics.json", JSON.stringify({
    generatedAt: new Date().toISOString(),
    sourceMode: topics.length > 0 ? "rss" : "fallback",
    sources: SOURCES.map(source => source.name),
    topics: finalTopics
  }, null, 2) + "\n", "utf8");

  console.log(`Wrote ${finalTopics.length} topics to topics.json`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
