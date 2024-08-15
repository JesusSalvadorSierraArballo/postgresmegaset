import { TableStructure } from "../types";

export function obtenerHtmlParaWebview(headers: string[], body: Array<Record<string, any[]>>) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Query results</title>
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
  
export function getERDiagram(tables: TableStructure[]) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Tabla Arrastrable en Canvas</title>
      <style>
        .vscode-style {
            color: var(--vscode-editor-foreground); 
        }
        html, body {
            margin: 0;
            padding: 0;
            overflow: hidden; /* Evita barras de desplazamiento */
        }

        #miCanvas {
            display: block; /* Elimina el espacio extra debajo del canvas */
            width: 100vw; /* Ancho del viewport */
            height: 100vh; /* Alto del viewport */
        }
    </style>
</head>
<body>
    <canvas id="miCanvas" width="100%" height="100%"></canvas>
    <script>

    function setupCanvas(canvas) {
        // Get the device pixel ratio, falling back to 1.
        var dpr = window.devicePixelRatio || 1;
        // Get the size of the canvas in CSS pixels.
        var rect = canvas.getBoundingClientRect();
        // Give the canvas pixel dimensions of their CSS
        // size * the device pixel ratio.
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        var ctx = canvas.getContext('2d');
        // Scale all drawing operations by the dpr, so you
        // don't have to worry about the difference.
        ctx.scale(dpr, dpr);
        return ctx;
    }
        function getCSSPropertyValue(className, property) {
            const element = document.createElement('div');
            element.className = className;
            document.body.appendChild(element);
            const style = window.getComputedStyle(element);
            const value = style.getPropertyValue(property);
            document.body.removeChild(element);
            return value.trim();
        }

        class tb {
            constructor({schema, name, columns, position = {x:0, y:0}}) {

                this.schema = schema;
                this.name = name;
                this.columns = columns;
                this.position = position

                this.maxWidth = Math.max(
                    this.schema.length, 
                    this.name.length, 
                    ...this.columns.map((c) => c.name.length )
                );

                this.cellWidth = this.maxWidth * 8;
                this.diagramColumnElements = [this.schema, this.name, ...this.columns.map((c) => c.name)];  

                this.cellHeight = 16;          //el doble del font size
                this.drag = false;
                this.hasForeignKey = columns.some((c)=>c.isForeignKey);
                this.size = {
                  x: Math.max(...this.diagramColumnElements.map((s)=>s.length)) * 8 + 10,
                  y: this.diagramColumnElements.length * 16
                }
            }

            draw(ctx) {
                for(let [i, value] of this.diagramColumnElements.entries()) {
                    let y = (this.cellHeight * i) + this.position.y;
                    ctx.strokeRect(this.position.x, y, this.cellWidth, this.cellHeight);
                    ctx.fillText(value,
                        this.position.x + 10, // Margen de 10
                        y + this.cellHeight/2 + 4 ); //la mitad del tamaño del espacio * la mitad del tamaño de letra
                }
            }

            getColumnPosition(column) {
                let position =this.diagramColumnElements.findIndex((e) => e === column )
                return this.position.y + (position * 16) + 8
            }

            getSize() {
              return this.size;
            };
            
            toString() {
                console.log({
                    schema:this.schema,
                    name:this.name,
                    columns: this.columns
                })
            }
        }

        let tables = ${JSON.stringify(tables)};

        var canvas = document.getElementById('miCanvas');
        var ctx = setupCanvas(document.getElementById('miCanvas'));
        ctx.strokeStyle = getCSSPropertyValue("vscode-style", "color");
        ctx.fillStyle = getCSSPropertyValue("vscode-style", "color");
        
        tablesObj = []
        let currentTablePositionX = 0;
        let currentTablePositionY = 0;
        let inFile = 1;
        let sizeInFile=[];

        for(let table of tables) {
            let newTb = new tb({...table, position:{x:currentTablePositionX, y:currentTablePositionY}});
            newTb.draw(ctx);
            tablesObj = [...tablesObj, newTb];

            currentTablePositionX += newTb.getSize().x;
            if(inFile%5 === 0) {
              currentTablePositionY += Math.max(...sizeInFile) +10; //gap 10
              sizeInFile = [];
              currentTablePositionX = 0;
            } else {
              sizeInFile = [...sizeInFile, newTb.size.y];
            }
            inFile++;
            //currentTablePositionY += newTb.getSize().y;
        }

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for(let tbl of tablesObj) {
                tbl.draw(ctx);
            }
            let tablesWithFK = tablesObj.filter(({columns})=> columns.some(({isForeignKey})=>isForeignKey))

            if(tablesWithFK.length) {

                for(let table of tablesWithFK) {
                     let columnsWithFK = table.columns.filter(({isForeignKey})=> isForeignKey).filter(({relationship})=> tablesObj.some((t) => t.name === relationship.table && t.schema === relationship.schema ));
                     for (let column of columnsWithFK) { 

                        let tblRel=tablesObj.find(({schema, name})=> column.relationship.schema == schema && 
                        column.relationship.table == name 
                         );

                        let pkTblIsInRigth = table.position.x >= (tblRel.position.x + tblRel.cellWidth);

                        ctx.beginPath();
                        ctx.moveTo(table.position.x + ( pkTblIsInRigth? 0: table.cellWidth) , table.getColumnPosition(column.name));
                        ctx.lineTo(tblRel.position.x + ( pkTblIsInRigth? tblRel.cellWidth: 0) , tblRel.getColumnPosition(column.relationship.column));
                        ctx.stroke();
                     }
                    
                }
            }
        }

        canvas.addEventListener('mousedown', function(e) {
            for(let tbl of tablesObj) {
                if(e.clientX >= tbl.position.x 
                    && e.clientX <= tbl.position.x + tbl.cellWidth
                    && e.clientY >= tbl.position.y 
                    && e.clientY <= tbl.position.y + tbl.cellHeight * tbl.diagramColumnElements.length) {
                
                        tbl.drag = true;
                }
            }
        });

        // Evento mouseup
        canvas.addEventListener('mouseup', function(e) {
            for(let tbl of tablesObj) {
                tbl.drag = false;
            }
        });

        // Evento mousemove
        canvas.addEventListener('mousemove', function(e) {
            for(let tbl of tablesObj) {
                if(tbl.drag) {
                    tbl.position.x = e.clientX - tbl.cellWidth / 2;
                    tbl.position.y = e.clientY - tbl.cellHeight * tbl.diagramColumnElements.length / 2;
                    draw();
                }
            }
        });
         draw();
    </script>
</body>
</html>
  `;
}
