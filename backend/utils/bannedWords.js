const xlsx = require("xlsx");

function loadBannedWords(filepath) {
  const workbook = xlsx.readFile(filepath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

  const words = [];

  for (const row of data) {
    if (Array.isArray(row)) {
      for (const cell of row) {
        if (typeof cell === "string") {
          words.push(cell.toLowerCase().trim());
        }
      }
    }
  }

  return words;
}

module.exports = { loadBannedWords };
