import { readFile, writeFile } from "node:fs/promises";

const MEMORY_PATH = "C:/Users/Ai/.codex/automations/ai-thinker/memory.md";
const OUTPUT_PATH = "ai-thinker-study-data.js";

function readSections(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      current = {
        heading: line.slice(3).trim(),
        lines: []
      };
      sections.push(current);
      continue;
    }

    if (current) current.lines.push(line);
  }

  return sections;
}

function readBulletValue(lines, label) {
  const prefix = `- ${label}:`;
  const match = lines.find(line => line.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : "";
}

function parseMemory(markdown) {
  const sections = readSections(markdown);
  const entries = [];
  const preferences = [];

  for (const section of sections) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(section.heading)) {
      entries.push({
        date: section.heading,
        product: readBulletValue(section.lines, "Studied"),
        category: readBulletValue(section.lines, "Category"),
        source: readBulletValue(section.lines, "Source"),
        notes: readBulletValue(section.lines, "Notes"),
        runTime: readBulletValue(section.lines, "Run time")
      });
      continue;
    }

    if (section.heading.startsWith("Preference Update")) {
      const preferenceDate = section.heading.replace("Preference Update", "").trim();
      preferences.push({
        date: preferenceDate,
        exclude: readBulletValue(section.lines, "Exclude"),
        reason: readBulletValue(section.lines, "Reason"),
        action: readBulletValue(section.lines, "Action"),
        runTime: readBulletValue(section.lines, "Run time")
      });
    }
  }

  entries.sort((a, b) => new Date(b.date) - new Date(a.date));
  preferences.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    updatedAt: new Date().toISOString(),
    memoryPath: MEMORY_PATH,
    totalEntries: entries.length,
    categories: [...new Set(entries.map(item => item.category).filter(Boolean))],
    entries,
    preferences
  };
}

async function main() {
  const memory = await readFile(MEMORY_PATH, "utf8");
  const data = parseMemory(memory);
  const output = `window.aiThinkerStudyData = ${JSON.stringify(data, null, 2)};\n`;
  await writeFile(OUTPUT_PATH, output, "utf8");
  console.log(`Updated ${OUTPUT_PATH} with ${data.totalEntries} study entries.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
