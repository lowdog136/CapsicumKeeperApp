// Скрипт для парсинга всех сортов перца с pepperseeds.ru/perec
// Сохраняет результат в scripts/all-peppers.json

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://pepperseeds.ru/perec';
const OUTPUT_FILE = path.join(__dirname, 'all-peppers.json');
const PAGE_COUNT = 97; // Можно сделать динамически, но для стабильности фиксируем

async function fetchPage(page) {
  const url = page === 1 ? BASE_URL : `${BASE_URL}?page=${page}`;
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PepperParser/1.0)',
    },
  });
  return data;
}

function parsePeppersFromHtml(html) {
  const $ = cheerio.load(html);
  const peppers = [];
  // Каждый товар — .product-thumb или .product-layout
  $('.product-thumb, .product-layout').each((_, el) => {
    const name = $(el).find('.caption a, .product-title a').first().text().trim();
    let price = $(el).find('.price').first().text().replace(/[^\d]/g, '');
    price = price ? parseInt(price, 10) : null;
    // Обычно "10 семян" в описании или под ценой
    let seedCount = 10;
    const text = $(el).text();
    const match = text.match(/(\d+)\s*сем/);
    if (match) seedCount = parseInt(match[1], 10);
    if (name) {
      peppers.push({ name, price, seedCount });
    }
  });
  return peppers;
}

async function main() {
  const allPeppers = [];
  for (let page = 1; page <= PAGE_COUNT; page++) {
    console.log(`Парсим страницу ${page} из ${PAGE_COUNT}...`);
    try {
      const html = await fetchPage(page);
      const peppers = parsePeppersFromHtml(html);
      allPeppers.push(...peppers);
    } catch (e) {
      console.error(`Ошибка на странице ${page}:`, e.message);
    }
  }
  // Сохраняем в файл
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPeppers, null, 2), 'utf-8');
  console.log(`Готово! Всего сортов: ${allPeppers.length}. Данные сохранены в ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main();
}
