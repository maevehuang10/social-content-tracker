import { readFile, writeFile } from "node:fs/promises";

const SOURCES = [
  { name: "CNX Software", url: "https://www.cnx-software.com/feed/" },
  { name: "IoT Now", url: "https://iot-now.com/feed/" },
  { name: "IoT Tech News", url: "https://iottechnews.com/feed/" }
];

const MAX_TOPICS = 36;
const MAX_SOURCE_ITEMS = 12;
const MIN_TODAY_TOPICS = 8;

const fallbackSources = [
  {
    title: "LoRaWAN solution content worth tracking",
    source: "RAKwireless",
    product: "LoRa Module",
    score: 95,
    formats: ["LinkedIn Post", "Carousel", "Sales Material"],
    platforms: ["LinkedIn", "Facebook"],
    tags: ["LoRa", "LoRaWAN", "Gateway"],
    value: "Useful for explaining complete LoRaWAN solutions to B2B users, including modules, gateways, sensor nodes, and cloud workflows.",
    summary: "Track how LoRaWAN brands turn hardware into complete deployment stories.",
    hook: "Some IoT projects need years of battery life, not more bandwidth.",
    post: "A strong LoRaWAN post should not only mention module specs. It should show the full deployment chain: sensor node, gateway, cloud, and the business problem it solves.",
    url: "https://www.linkedin.com/company/rakwireless/"
  },
  {
    title: "ESP32 developer ecosystem angle",
    source: "Espressif Systems",
    product: "ESP32 Module",
    score: 96,
    formats: ["LinkedIn Post", "Carousel", "Short Video"],
    platforms: ["LinkedIn", "Facebook", "YouTube"],
    tags: ["ESP32", "Embedded Development", "Smart Device"],
    value: "Useful for explaining how ESP32 modules support smart devices, control panels, gateways, and rapid prototyping.",
    summary: "ESP32 ecosystem content is useful when it turns chip capability into developer workflows and visible demos.",
    hook: "A small module can shape the whole connected product experience.",
    post: "ESP32 content works best when it connects the module to a real device workflow: connectivity, control, UI, sensing, and deployment.",
    url: "https://www.linkedin.com/company/espressif-systems"
  },
  {
    title: "Matter and smart-home compatibility story",
    source: "Home Assistant",
    product: "WiFi Module",
    score: 94,
    formats: ["LinkedIn Post", "Carousel", "Sales Material"],
    platforms: ["LinkedIn", "Facebook"],
    tags: ["Matter", "Smart Home", "Interoperability"],
    value: "Useful for smart-home customers who care about compatibility, certification readiness, and faster product development.",
    summary: "Smart-home module content should explain compatibility and integration value, not only wireless specs.",
    hook: "Smart home buyers are no longer asking only for connectivity. They want compatibility.",
    post: "For smart-home devices, wireless modules become more valuable when they reduce integration risk and help products fit into existing ecosystems.",
    url: "https://www.home-assistant.io/"
  },
  {
    title: "Radar sensing for privacy-friendly presence detection",
    source: "Industry Sensing",
    product: "Radar Sensor",
    score: 92,
    formats: ["Short Video", "LinkedIn Post", "Carousel"],
    platforms: ["LinkedIn", "Facebook", "TikTok", "YouTube"],
    tags: ["Radar", "Presence Detection", "Smart Sensing"],
    value: "Useful for explaining camera-free sensing in elderly care, bathrooms, bedrooms, security, and automation scenarios.",
    summary: "Radar content is strongest when it starts from the user problem: reliable presence detection without a camera.",
    hook: "Not every sensing solution needs a camera.",
    post: "Radar sensing can be explained through practical spaces: bathroom, bedroom, entryway, or care facility. Start with the pain point, then explain why camera-free sensing matters.",
    url: ""
  },
  {
    title: "Wi-Fi and Bluetooth module selection checklist",
    source: "Ai-Thinker Content Desk",
    product: "WiFi Module",
    score: 91,
    formats: ["LinkedIn Post", "Carousel", "Sales Material"],
    platforms: ["LinkedIn", "Facebook"],
    tags: ["WiFi", "Bluetooth", "Module Selection"],
    value: "Useful for turning technical selection criteria into customer-facing module education.",
    summary: "A practical checklist helps overseas buyers compare wireless modules by scenario, certification, interface, power, and development effort.",
    hook: "Module selection is easier when the customer starts from the device scenario.",
    post: "A useful module-selection post can compare application scenarios first, then explain range, power, interface, certification, and development support.",
    url: "https://docs.ai-thinker.com/"
  },
  {
    title: "Industrial IoT gateway content angle",
    source: "Ai-Thinker Content Desk",
    product: "LoRa Module",
    score: 90,
    formats: ["LinkedIn Post", "Carousel"],
    platforms: ["LinkedIn", "Facebook"],
    tags: ["Industrial IoT", "Gateway", "LoRaWAN"],
    value: "Useful for explaining gateway-to-cloud deployment value for factories, meters, agriculture, and asset monitoring.",
    summary: "Gateway stories work well when they connect sensor data, network coverage, cloud access, and maintenance cost.",
    hook: "A gateway is more than a box. It is the bridge between field data and business decisions.",
    post: "For B2B audiences, start from field deployment pain points: device density, coverage, maintenance, and cloud integration.",
    url: "https://www.thethingsnetwork.org/"
  },
  {
    title: "UWB positioning application story",
    source: "Ai-Thinker Content Desk",
    product: "UWB Module",
    score: 89,
    formats: ["LinkedIn Post", "Short Video", "Carousel"],
    platforms: ["LinkedIn", "Facebook", "TikTok", "YouTube"],
    tags: ["UWB", "RTLS", "Positioning"],
    value: "Useful for explaining precise positioning use cases in warehouses, factories, hospitals, and logistics.",
    summary: "UWB content is strongest when it shows why meter-level accuracy is not enough for some indoor workflows.",
    hook: "When every meter matters, positioning content needs to show the workflow.",
    post: "A strong UWB post can show a before-and-after workflow: manual search, real-time location, alerts, and operational visibility.",
    url: "https://www.firaconsortium.org/"
  },
  {
    title: "Matter-ready smart home product narrative",
    source: "Ai-Thinker Content Desk",
    product: "ESP32 Module",
    score: 93,
    formats: ["LinkedIn Post", "Carousel", "Sales Material"],
    platforms: ["LinkedIn", "Facebook"],
    tags: ["Matter", "Smart Home", "ESP32"],
    value: "Useful for explaining how wireless modules help brands reduce smart-home integration risk.",
    summary: "Smart-home customers care about interoperability, ecosystem trust, certification readiness, and developer support.",
    hook: "Compatibility is becoming a product feature, not a technical footnote.",
    post: "For smart-home audiences, explain how module choice affects app integration, ecosystem compatibility, and time to market.",
    url: "https://csa-iot.org/all-solutions/matter/"
  },
  {
    title: "Radar sensor short-video demonstration idea",
    source: "Ai-Thinker Content Desk",
    product: "Radar Sensor",
    score: 94,
    formats: ["Short Video", "LinkedIn Post"],
    platforms: ["TikTok", "YouTube", "LinkedIn", "Facebook"],
    tags: ["Radar", "Presence Detection", "Demo"],
    value: "Useful for turning radar sensing into visible, scenario-led short videos.",
    summary: "Radar posts need clear scenes: bathroom, bedroom, corridor, office, or care facility. Show the detection result before explaining the sensor.",
    hook: "Show the result first, then explain the sensor.",
    post: "Use a short demo flow: empty room, person enters, status changes, automation triggers, then explain camera-free privacy value.",
    url: ""
  },
  {
    title: "BLE beacon and channel sounding topic",
    source: "Ai-Thinker Content Desk",
    product: "BLE Module",
    score: 88,
    formats: ["LinkedIn Post", "Carousel"],
    platforms: ["LinkedIn", "Facebook"],
    tags: ["BLE", "Beacon", "Positioning"],
    value: "Useful for explaining BLE beyond basic connectivity, especially proximity and positioning scenarios.",
    summary: "BLE content can connect beacons, access control, asset visibility, indoor positioning, and low-power connected products.",
    hook: "Bluetooth is becoming a location and proximity story.",
    post: "A practical BLE post can compare simple connectivity, beacon broadcasting, and more advanced distance-aware applications.",
    url: "https://www.bluetooth.com/"
  },
  {
    title: "Low-power connected device design angle",
    source: "Ai-Thinker Content Desk",
    product: "IoT Industry",
    score: 87,
    formats: ["LinkedIn Post", "Sales Material"],
    platforms: ["LinkedIn", "Facebook"],
    tags: ["Low Power", "Battery Life", "IoT Design"],
    value: "Useful for B2B education around battery life, sleep current, communication interval, and deployment cost.",
    summary: "Low-power content is valuable when it links technical design choices to maintenance cost and field reliability.",
    hook: "Battery life is not a spec. It is a deployment cost question.",
    post: "Explain low-power design through a field example: reporting interval, sleep mode, network choice, battery replacement cycle, and service cost.",
    url: ""
  }
];

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

function isRelevantItem(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  const positiveKeywords = [
    "iot", "module", "wireless", "sensor", "gateway", "embedded", "mcu", "microcontroller",
    "esp32", "lora", "lorawan", "lpwan", "uwb", "bluetooth", "ble", "wifi", "wi-fi",
    "matter", "radar", "mmwave", "presence", "positioning", "rtls", "smart home",
    "industrial", "meter", "asset tracking", "edge ai", "development board", "soc"
  ];
  const weakConsumerKeywords = [
    "mini pc", "laptop", "desktop", "gaming", "sponsored", "discount", "coupon", "off by"
  ];

  const hasPositive = positiveKeywords.some(keyword => text.includes(keyword));
  const isPromo = /sponsored|discount|coupon|off by|limited time/.test(text);
  const looksConsumerOnly = weakConsumerKeywords.some(keyword => text.includes(keyword))
    && !/(iot|embedded|development board|module|sensor|gateway|industrial|soc)/.test(text);

  return hasPositive && !looksConsumerOnly && !isPromo;
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

function todayString() {
  const now = new Date(Date.now() + 8 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

function fallbackTopicsForToday(existingTopics) {
  const today = todayString();
  const todayCount = existingTopics.filter(topic => topic.date === today).length;
  const needed = Math.max(0, MIN_TODAY_TOPICS - todayCount);
  if (needed === 0) return [];

  const seed = Number(today.replaceAll("-", "").slice(-2)) % fallbackSources.length;
  return Array.from({ length: needed }, (_, index) => ({
    ...fallbackSources[(seed + index) % fallbackSources.length],
    date: today
  }));
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
    .filter(isRelevantItem)
    .map(toTopic)
    .sort((a, b) => {
      const dateDiff = new Date(b.date) - new Date(a.date);
      return dateDiff || b.score - a.score;
    })
    .slice(0, MAX_TOPICS);

  const baseTopics = (topics.length > 0 ? topics : await readExistingTopics()).map(withSummary);
  const finalTopics = dedupe([...fallbackTopicsForToday(baseTopics), ...baseTopics]).slice(0, MAX_TOPICS);

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
