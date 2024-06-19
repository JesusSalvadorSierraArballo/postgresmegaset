export function obtenerHtmlParaWebview(headers: string[], body: Array<Record<string, any[]>>) {
  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Pokémon</title>
      </head>
      <body>
          <table>
            <thead>
                <tr>
                    ${headers.map((h) => `<th>${h}</th>`).join('')}
                </tr>
                </thead>
                <tbody>
                    ${body.map((b) => `<tr>${headers.map(h => `<td>${b[h]}</td>`)}</tr>` ).join('')}
                </tbody>
          </table>
      </body>
      </html>`;
}
