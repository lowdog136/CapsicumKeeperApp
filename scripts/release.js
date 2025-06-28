#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Читаем package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

console.log(`🚀 Current version: ${currentVersion}`);

// Получаем тип релиза из аргументов
const releaseType = process.argv[2];
if (!releaseType || !['patch', 'minor', 'major'].includes(releaseType)) {
  console.error('❌ Please specify release type: patch, minor, or major');
  console.log('Usage: npm run release:patch|minor|major');
  process.exit(1);
}

// Разбиваем версию на части
const [major, minor, patch] = currentVersion.split('.').map(Number);

// Вычисляем новую версию
let newVersion;
switch (releaseType) {
  case 'patch':
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
}

console.log(`📦 New version: ${newVersion}`);

try {
  // Обновляем версию в package.json
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  console.log('✅ Updated package.json');

  // Создаем коммит с новой версией
  execSync('git add package.json', { stdio: 'inherit' });
  execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
  console.log('✅ Created version commit');

  // Создаем тег
  execSync(`git tag -a v${newVersion} -m "Version ${newVersion}"`, { stdio: 'inherit' });
  console.log('✅ Created git tag');

  // Отправляем изменения
  execSync('git push origin HEAD', { stdio: 'inherit' });
  execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
  console.log('✅ Pushed to remote');

  console.log(`🎉 Release ${newVersion} created successfully!`);
  console.log('📋 Next steps:');
  console.log('   1. Update CHANGELOG.md with new features');
  console.log('   2. Review the GitHub release');
  console.log('   3. Deploy to production if needed');
} catch (error) {
  console.error('❌ Error creating release:', error.message);
  process.exit(1);
}
