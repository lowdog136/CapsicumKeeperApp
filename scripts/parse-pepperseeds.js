// Скрипт для парсинга всех сортов перца с pepperseeds.ru/perec
// Сохраняет результат в scripts/all-peppers.json

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://pepperseeds.ru/perec';
const OUTPUT_FILE = path.join(__dirname, 'all-peppers.json');

// Определяем количество страниц динамически
async function detectTotalPages() {
  try {
    const html = await fetchPage(1);
    const $ = cheerio.load(html);

    // 1) Пробуем извлечь из текста вида: "всего 108 страниц"
    const pageText = $('body').text();
    const m = pageText.match(/всего\s+(\d+)\s+страниц/i);
    if (m && m[1]) {
      return parseInt(m[1], 10);
    }

    // 2) Либо берем последнее число из пагинации
    let lastNum = 1;
    $('.pagination a, .pagination span').each((_, el) => {
      const t = $(el).text().trim();
      const n = parseInt(t, 10);
      if (!isNaN(n) && n > lastNum) lastNum = n;
    });
    return lastNum || 1;
  } catch (e) {
    console.warn('Не удалось определить количество страниц, используем 1:', e.message);
    return 1;
  }
}

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
  $('.product-thumb').each((_, el) => {
    const name = $(el).find('.product-thumb__name').text().trim();
    let price = $(el).find('.product-thumb__price').attr('data-price');
    if (!price) {
      price = $(el).find('.product-thumb__price').text().replace(/[^\d]/g, '');
    }
    price = price ? parseInt(price, 10) : null;

    let seedCount = 10;
    const attrText = $(el).find('.product-thumb__attribute').text();
    const match = attrText.match(/(\d+)\s*сем/);
    if (match) seedCount = parseInt(match[1], 10);

    // Описание
    const description = $(el).find('.product-thumb__description').text().trim();
    // Для поиска дополнительных данных используем объединённый текст
    const fullText = attrText + ' ' + description;

    // Острота (SHU)
    let shu = null;
    const shuMatch = fullText.match(/([\d\s]+)[-–—]{1,2}([\d\s]+)\s*shu/i);
    if (shuMatch) {
      const minShu = parseInt(shuMatch[1].replace(/\s/g, ''), 10);
      const maxShu = parseInt(shuMatch[2].replace(/\s/g, ''), 10);
      if (!isNaN(minShu) && !isNaN(maxShu)) {
        shu = [minShu, maxShu];
      }
    }

    // Вид (Capsicum ...)
    let species = null;
    const speciesMatch = fullText.match(/Capsicum\s+[a-z]+/i);
    if (speciesMatch) {
      species = speciesMatch[0];
    }

    // Вес (г)
    let weight = null;
    const weightMatch = description.match(/(\d+)\s*г/);
    if (weightMatch) {
      weight = parseInt(weightMatch[1], 10);
    }

    // Длина (см)
    let length = null;
    const lengthMatch = description.match(/(\d+)\s*см/);
    if (lengthMatch) {
      length = parseInt(lengthMatch[1], 10);
    }

    if (name) {
      const pepper = { name, price, seedCount };
      if (shu) pepper.shu = shu;
      if (species) pepper.species = species;
      if (description) pepper.description = description;
      if (weight) pepper.weight = weight;
      if (length) pepper.length = length;
      peppers.push(pepper);
    }
  });
  return peppers;
}

async function main() {
  const allPeppers = [];
  const totalPages = await detectTotalPages();
  console.log(`Обнаружено страниц: ${totalPages}`);
  for (let page = 1; page <= totalPages; page++) {
    console.log(`Парсим страницу ${page} из ${totalPages}...`);
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

// Запускаем main функцию
main().catch((error) => {
  console.error('Ошибка при выполнении парсинга:', error);
  process.exit(1);
});
