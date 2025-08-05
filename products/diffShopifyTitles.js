const fs = require('fs');
const csv = require('csv-parser');

// 1. قراءة المنتجات من JSON
const pastura = JSON.parse(fs.readFileSync('products-pastura.json', 'utf8'));
const existingHandles = new Set(
  pastura
    .map(p => p.handle?.toLowerCase().trim())
    .filter(Boolean)
);

console.log(`🧾 عدد المنتجات في JSON: ${pastura.length}`);

const missingHandles = [];
let csvCount = 0;

// 2. تحميل CSV والبحث عن الـ handles غير الموجودة
fs.createReadStream('productsBuyButton.csv')
  .pipe(csv())
  .on('data', (row) => {
    csvCount++;

    const csvHandle = row['Handle']?.toLowerCase().trim();
    if (
      csvHandle &&
      !existingHandles.has(csvHandle) &&
      !missingHandles.includes(csvHandle)
    ) {
      missingHandles.push(csvHandle);
    }
  })
  .on('end', () => {
    console.log(`🧾 عدد المنتجات في CSV: ${csvCount}`);
    console.log(`✅ عدد الـ handles الغائبة في JSON: ${missingHandles.length}`);
    fs.writeFileSync('missing-handles.json', JSON.stringify(missingHandles, null, 2), 'utf8');
    console.log('📄 تم حفظ الملف: missing-handles.json');
  });
