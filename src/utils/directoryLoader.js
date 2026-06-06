export async function fetchDirectoryRecords(sheetId, sheetName) {
  if (!sheetId) return [];
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName,
  )}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to fetch directory sheet (${response.status})`);
  const csvText = await response.text();

  function parseCsv(csvText) {
    const lines = csvText.split(/\r?\n/);
    return lines
      .map((line) => {
        const row = [];
        let current = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
            continue;
          }
          if (char === "," && !inQuotes) {
            row.push(current);
            current = "";
            continue;
          }
          current += char;
        }
        row.push(current);
        return row;
      })
      .filter((row) => row.some((cell) => String(cell || "").trim()));
  }

  function findHeaderRowIndex(rows) {
    for (let i = 0; i < rows.length; i += 1) {
      const nonEmptyCells = rows[i].filter((cell) => String(cell || "").trim()).length;
      if (nonEmptyCells >= 2) return i;
    }
    return 0;
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) return [];
  const headerRowIndex = findHeaderRowIndex(rows);
  const headers = rows[headerRowIndex].map((h) => String(h || "").trim());
  const records = rows
    .slice(headerRowIndex + 1)
    .map((row, i) => {
      const rec = headers.reduce((acc, header, index) => {
        if (header) acc[header] = row[index] ?? "";
        return acc;
      }, {});
      // _rowIndex is the sheet row number (1-based) for stable linking
      rec._rowIndex = headerRowIndex + 2 + i;
      return rec;
    });

  return records;
}
