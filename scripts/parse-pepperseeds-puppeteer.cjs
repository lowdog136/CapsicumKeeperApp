// Скрипт для парсинга всех сортов перца с pepperseeds.ru/perec через Puppeteer
// Сохраняет результат в scripts/all-peppers.json

const fs = require('fs');
const path = require('path');
const OUTPUT_FILE = path.join(__dirname, 'all-peppers.json');

async function detectTotalPages(page) {
  // Пробуем найти текст "всего N страниц" или последнюю цифру в пагинации
  try {
    const text = await page.evaluate(() => document.body.innerText);
    const m = text.match(/всего\s+(\d+)\s+страниц/i);
    if (m && m[1]) return parseInt(m[1], 10);

    const lastNum = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.pagination a, .pagination span'));
      return nodes
        .map((n) => parseInt(n.textContent.trim(), 10))
        .filter((n) => !Number.isNaN(n))
        .reduce((max, n) => (n > max ? n : max), 1);
    });
    return lastNum || 1;
  } catch (e) {
    console.warn('Не удалось определить количество страниц (puppeteer), используем 1:', e.message);
    return 1;
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch (e) {
    console.error('Пожалуйста, установите puppeteer: npm install puppeteer');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  const allLinks = new Set();
  // Сначала собираем все ссылки на сорта
  // Определяем количество страниц
  await page.goto('https://pepperseeds.ru/perec', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const totalPages = await detectTotalPages(page);
  for (let p = 1; p <= totalPages; p++) {
    const url = p === 1 ? 'https://pepperseeds.ru/perec' : `https://pepperseeds.ru/perec?page=${p}`;
    console.log(`Собираем ссылки на сорта, страница ${p} из ${totalPages}...`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(1200 + Math.random() * 800);
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.product-thumb__name')).map((a) => a.href);
      });
      links.forEach((link) => allLinks.add(link));
    } catch (e) {
      console.error(`Ошибка на странице ${p}:`, e.message);
    }
  }
  console.log(`Всего уникальных ссылок на сорта: ${allLinks.size}`);

  // Теперь парсим каждую карточку сорта
  const allPeppers = [];
  let i = 0;
  for (const link of allLinks) {
    i++;
    console.log(`Парсим сорт ${i} из ${allLinks.size}: ${link}`);
    try {
      await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await delay(1200 + Math.random() * 800);
      const pepper = await page.evaluate(() => {
        function extractShu(text) {
          const m = text.match(/([\d\s]+)[-–—]{1,2}([\d\s]+)\s*shu/i);
          if (m) {
            const min = parseInt(m[1].replace(/\s/g, ''), 10);
            const max = parseInt(m[2].replace(/\s/g, ''), 10);
            if (!isNaN(min) && !isNaN(max)) return [min, max];
          }
          return null;
        }
        function extractSpecies(text) {
          const m = text.match(/Capsicum\s+[a-z]+/i);
          return m ? m[0] : null;
        }
        function extractWeight(text) {
          const m = text.match(/(\d+)\s*г/);
          return m ? parseInt(m[1], 10) : null;
        }
        function extractLength(text) {
          const m = text.match(/(\d+)\s*см/);
          return m ? parseInt(m[1], 10) : null;
        }
        function extractColors(text) {
          const colors = [];
          const colorWords = [
            'красный',
            'желтый',
            'оранжевый',
            'зеленый',
            'фиолетовый',
            'шоколадный',
            'белый',
            'черный',
            'розовый',
            'персиковый',
            'золотой',
            'пурпурный',
            'сиреневый',
            'коричневый',
            'синий',
            'голубой',
            'кремовый',
            'янтарный',
          ];
          for (const word of colorWords) {
            const re = new RegExp(word, 'ig');
            if (re.test(text) && !colors.includes(word)) colors.push(word);
          }
          return colors.length ? colors : null;
        }
        function extractHeight(text) {
          let m = text.match(/высот[аы]?\s*(до)?\s*(\d{2,3})(?:\s*[-–—]\s*(\d{2,3}))?\s*см/i);
          if (m) {
            if (m[3]) return [parseInt(m[2], 10), parseInt(m[3], 10)];
            return [parseInt(m[2], 10)];
          }
          m = text.match(/растени[ея]\s*(до)?\s*(\d{2,3})\s*см/i);
          if (m) return [parseInt(m[2], 10)];
          m = text.match(/до\s*(\d{2,3})\s*см/i);
          if (m) return [parseInt(m[1], 10)];
          return null;
        }
        function extractMaturity(text) {
          let m = text.match(
            /(созревани[ея]|от всходов до созревания|период созревания)[^\d]*(\d{2,3})(?:\s*[-–—]\s*(\d{2,3}))?\s*дн/i,
          );
          if (m) {
            if (m[3]) return [parseInt(m[2], 10), parseInt(m[3], 10)];
            return [parseInt(m[2], 10)];
          }
          m = text.match(/созревает[^\d]*(\d{2,3})\s*дн/i);
          if (m) return [parseInt(m[1], 10)];
          return null;
        }
        const name = document.querySelector('h1')?.textContent.trim();
        const descBlock = document.querySelector('#tab-description');
        const description = descBlock ? descBlock.textContent.trim() : '';
        const fullText = description;
        const shu = extractShu(fullText);
        const species = extractSpecies(fullText);
        const weight = extractWeight(fullText);
        const length = extractLength(fullText);
        const color = extractColors(fullText);
        const height = extractHeight(fullText);
        const maturity = extractMaturity(fullText);
        if (name) {
          const pepper = { name };
          if (shu) pepper.shu = shu;
          if (species) pepper.species = species;
          if (description) pepper.description = description;
          if (weight) pepper.weight = weight;
          if (length) pepper.length = length;
          if (color) pepper.color = color;
          if (height) pepper.height = height;
          if (maturity) pepper.maturity = maturity;
          return pepper;
        }
        return null;
      });
      if (pepper) allPeppers.push(pepper);
    } catch (e) {
      console.error(`Ошибка при парсинге сорта: ${link}`, e.message);
    }
  }
  await browser.close();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPeppers, null, 2), 'utf-8');
  console.log(`Готово! Всего сортов: ${allPeppers.length}. Данные сохранены в ${OUTPUT_FILE}`);
}

if (require.main === module) {
  main();
}
