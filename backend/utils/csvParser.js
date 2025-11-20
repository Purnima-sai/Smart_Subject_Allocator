const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

exports.parseCSV = (filePath) => new Promise((resolve, reject) => {
  try {
    const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    fs.stat(absolutePath, (err, stats) => {
      if (err) {
        return reject(new Error(`CSV file not accessible (${absolutePath}): ${err.code || err.message}`));
      }
      if (!stats.isFile()) {
        return reject(new Error(`CSV path is not a file: ${absolutePath}`));
      }
      const results = [];
      fs.createReadStream(absolutePath)
        .on('error', (streamErr) => reject(new Error(`Failed reading CSV: ${streamErr.code || streamErr.message}`)))
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (parseErr) => reject(new Error(`CSV parse error: ${parseErr.message}`)));
    });
  } catch (e) {
    reject(e);
  }
});

exports.writeCSV = (filePath, rows) => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]).join(',') + '\n';
  const lines = rows.map(r => Object.values(r).join(',')).join('\n');
  fs.writeFileSync(filePath, headers + lines);
};
