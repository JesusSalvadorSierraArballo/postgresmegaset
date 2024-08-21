import * as vscode from 'vscode';
import * as path from 'path';
import { ConnectionInfo } from '../conectionInfo';
import { PgConnect } from '../pgconnect';
import { TableInfo, TableStructure } from '../types';

export class Table extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public server: { user: string, password: string, host: string, port: number, database: string },
    public schema:string 
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}`;
    }

  iconPath = {
    light: path.join(__filename,'..',  '..', '..', '..', 'assets', 'light', 'database.svg'), //TODO FIX THAT ICON COLOR
    dark: path.join(__dirname, '..', '..', 'assets', 'dark', 'table.svg')
  };

  async getTableStructure() {
    const tableStructure = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.server.database))
    .getTablesStructure(this.schema, this.label);
    //TODO FIX THE KEYS 
    const columns = tableStructure.rows.
      filter((c: any, index: number, self: Array<any>) =>
        index === self.findIndex((t) => (
          t.column === c.column && t.schema === c.schema
        )))
      .map((c: any) => ({
        name: c.column,
        datatype: c.dataType,
        isPrimaryKey: Boolean(c.isPrimaryKey),
        isForeignKey: Boolean(c.isForeignKey),
        relationship: {
          schema: c.schemaDestination,
          table: c.tableDestination,
          column: c.columna_destino,
        }
      }));

    let tb: TableStructure = {
      schema: this.schema,
      name: this.label,
      columns
    };
    return Promise.resolve(tb);
  }

  getSelectTop = async () => 
  {
    const tableStructure = await (this.getTableStructure());
    return `SELECT\n${ tableStructure.columns.map((c)=> `  "${c.name}"`).join(",\n")}\nFROM '${tableStructure.schema}'.'${tableStructure.name}'`;
  };

  getInsert = async () => 
  {
    const tableStructure = await (this.getTableStructure());
    return `SELECT\n${ tableStructure.columns.map((c)=> `  "${c.name}"`).join(",\n")}\nFROM '${tableStructure.schema}'.'${tableStructure.name}'`;
  };

  getCrudScript = async () => {
    const result = await new ConnectionInfo(new PgConnect(this.server.user, this.server.password, this.server.host, this.server.port, this.server.database))
    .getTablesStructure(this.schema, this.label);

    let data = result.rows as TableInfo[];
    const columns = result.rows.
      filter((c: any, index: number, self: Array<any>) =>
        index === self.findIndex((t) => (
          t.column === c.column && t.schema === c.schema
        )))
      .map((c: any) => ({
        name: c.column,
        dataType: c.dataType,
        isPrimaryKey: Boolean(c.isPrimaryKey),
        isForeignKey: Boolean(c.isForeignKey),
        isDate: Boolean(c.isDate),
        relationship: {
          schema: c.schemaDestination,
          table: c.tableDestination,
          column: c.columna_destino,
        }
      }));
    let fields = data.map((el) => ({
       columnName: el.column,
      // columnNameFirstUpper: changeCaseFirstLetter(el.column, false),
      // columnNameHasCapitalLetter: hasCapitalLetters(el.column),
      // tableNameSingularFirstLowerCase: changeCaseFirstLetter(singularize(el.table), true),
      // tableNameSingularLowerCase: singularize(el.table).toLowerCase(),
      dataType: el.dataType,
      // stringLength: el.numeric_precision,
      // //Agrupadores
      isPrimaryKey: Boolean(el.isPrimaryKey),
      // default: (Boolean(el.HAS_DEFAULT) || el.IS_IDENTITY),
      // insertable: !(Boolean(el.isPrimaryKey) || Boolean(el.isStatus)),
      // // Datatypes
      isDate: Boolean(el.isDate),
      isString: Boolean(el.isString),
      // isNumeric: Boolean(el.IS_NUMERIC),
      // isBoolean: Boolean(el.IS_BOOLEAN),
      // isEstatus: Boolean(el.isStatus),
      // isNullable: Boolean(el.nullable),
      // //Foreign keys
      hasForeignKey: Boolean(el.isForeignKey),
       secondColumn: el.secondColumn,
       schemaRef: el.schemaDestination,
       //schemaRefHasCapitalLetter: hasCapitalLetters(el.schemaDestination),
       tableRef: el.tableDestination,
       //tablePref:  el.table.replace(/[a-z]/g, '').toLowerCase(),
       tablePrefRef: (el.tableDestination ? el.tableDestination.replace(/[a-z]/g, '').toLowerCase(): ''),
      //DataTypes
      //...mssql(el)
      //...pg(el),
      //...ts(el)
    }));

    const tableStructure = {
      tableName: data[0].table,
      // tableNameSingular: changeCaseFirstLetter(singularize(data[0].table), false),
      // tableNameSingularFirstLowerCase: changeCaseFirstLetter(singularize(data[0].table), true),
      // tableNameCamelCase: changeCaseFirstLetter(data[0].table, true),
      // tableNameLowerCase: data[0].table.toLowerCase(),
      // schemaNameHasCapitalLetter: hasCapitalLetters(data[0].schema),
      // tableNameHasCapitalLetter: hasCapitalLetters(data[0].table),
      tableSchema: data[0].schema,
      // tableSchemaLowerCase: data[0].schema.toLowerCase(),
      // secondColumn: data.find((d: any) => d.ordinal_position === 2).column,
      // secondColumnFirstLetterUpperCase: changeCaseFirstLetter(data.find((d: any) => d.ordinal_position === 2).column, false),
      tablePref: data[0].table.replace(/[a-z]/g, '').toLowerCase(),
      hasStatus: Boolean(data.some((el: any) => el.isStatus === 1)),
      //hasDateFields: Boolean(data.some((el: any) => el.isDate === 1)),
      hasForeignKey: data.some((el) => el.isForeignKey === 1),
      hasStringFields: data.some((el) => el.isString === 1),
      fields,
      columns,
      foreignKeys: fields
        .filter(({hasForeignKey})=> Boolean(hasForeignKey))
    };

    return (`
CREATE FUNCTION "${tableStructure.tableSchema}"."Get${tableStructure.tableName}" (
  ${[
    tableStructure.hasStringFields ? 'ptext text': null,
    ...tableStructure.fields.filter((f)=> f.isDate).map((col: any)=> `"p${col.columnName}" ${col.dataType}`),
    tableStructure.hasStatus ? 'pstatus boolean': null
  ].filter(Boolean).join(",\n  ")}
  )
  RETURNS TABLE( ${tableStructure.fields.map((col) => 
    `"${col.columnName}" ${col.dataType}${(col.hasForeignKey)? `, "${col.secondColumn}" ${col.dataType}`: ''}`).join(", ")} ) 
  LANGUAGE 'plpgsql'
AS $BODY$
  BEGIN
  RETURN QUERY
    SELECT
      ${tableStructure.fields.map((col) => 
        `${tableStructure.tablePref}."${col.columnName}"${(col.hasForeignKey)? `,  + ${col.tablePrefRef}."${col.secondColumn}"`: ''}`).join(",\n      ")}
    FROM "${tableStructure.tableSchema}"."${tableStructure.tableName}" ${tableStructure.tablePref}${tableStructure.foreignKeys.map((fk)=>
`      INNER JOIN "${fk.schemaRef}"."${fk.tableRef}" ${fk.tablePrefRef}
        ON ${tableStructure.tablePref}."${fk.columnName}" = ${fk.tablePrefRef}."${fk.columnName}"`).join('\n')}
    WHERE  ${[ 
      tableStructure.hasStringFields ? 
      [
        "(ptext = '%' ",
        ...tableStructure.fields.filter((col)=> col.isString).map((col) => 
          ` UPPER(${tableStructure.tablePref}."${col.columnName}") LIKE CONCAT('%', UPPER(ptext), '%')`),
      ].join('\n      OR').concat(')'): null,
      ...tableStructure.fields.filter((col)=> col.isDate && col).map((col) => 
       `(${tableStructure.tablePref}."${col.columnName}" <= p${col.columnName} AND ${tableStructure.tablePref}.${col.columnName} >= p${col.columnName}) `
      ),
      tableStructure.hasStatus &&
      `(pstatus IS NULL OR ${tableStructure.tablePref}.status = pstatus)`
    ].filter(Boolean).join('\n      AND ')};
  END;
$BODY$;

CREATE FUNCTION "${tableStructure.tableSchema}"."Create${tableStructure.tableName}"(
  ${tableStructure.fields.map((col)=>`"p${col.columnName}" ${col.dataType}`).join(",\n  ")}
  )
  RETURNS TABLE( ${tableStructure.fields.map((col)=>`"${col.columnName}" ${col.dataType}`).join(", ")})
  LANGUAGE 'plpgsql'
AS $BODY$
  BEGIN
    RETURN QUERY
    INSERT INTO "${tableStructure.tableSchema}"."${tableStructure.tableName}" AS ${tableStructure.tablePref} (${tableStructure.fields.map((col)=>`"${col.columnName}"`).join(", ")})
      VALUES (${tableStructure.fields.map((col)=>`"p${col.columnName}"`).join(", ")})
      RETURNING ${tableStructure.fields.map((col)=>`${tableStructure.tablePref}."${col.columnName}"`).join(", ")};
  END;
$BODY$;

CREATE FUNCTION "${tableStructure.tableSchema}"."Update${tableStructure.tableName}"(
  ${tableStructure.fields.map((col)=>`"p${col.columnName}" ${col.dataType}`).join(",\n  ")}
)
  RETURNS TABLE( 
    ${tableStructure.fields.map((col)=>`"${col.columnName}" ${col.dataType}`).join(",\n    ")})
  LANGUAGE 'plpgsql'
AS $BODY$
  BEGIN
    RETURN QUERY
    UPDATE "${tableStructure.tableSchema}"."${tableStructure.tableName}" AS ${tableStructure.tablePref}
      SET
        ${tableStructure.fields.filter(({isPrimaryKey})=>!isPrimaryKey).map((col)=>`"${col.columnName}" = CASE WHEN "p${col.columnName}" IS NULL THEN ${tableStructure.tablePref}."${col.columnName}" ELSE "p${col.columnName}" END`).join(",\n        ")}
      WHERE ${tableStructure.fields.filter(({isPrimaryKey})=>isPrimaryKey).map((col)=>`${tableStructure.tablePref}."${col.columnName}" = "p${col.columnName}"`).join("\n        AND ")}
      RETURNING  ${tableStructure.fields.map((col)=>`${tableStructure.tablePref}."${col.columnName}"`).join(",\n        ")};
  END;
$BODY$;

${tableStructure.hasStatus ?
`CREATE FUNCTION "${tableStructure.tableSchema}"."Toggle${tableStructure.tableName}Status"
(
  ${tableStructure.fields.filter(({isPrimaryKey})=>isPrimaryKey).map((col)=>`"p${col.columnName}" ${col.dataType}`).join(",\n  ")}
)
  RETURNS TABLE(${tableStructure.fields.map((col)=>`"${col.columnName}" ${col.dataType}`).join(",\n    ")})
  LANGUAGE 'plpgsql'
AS $BODY$
  BEGIN
    RETURN QUERY
    UPDATE "${tableStructure.tableSchema}"."${tableStructure.tableName}" AS ${tableStructure.tablePref}
      SET status = NOT ${tableStructure.tablePref}.status
        WHERE ${tableStructure.fields.filter(({isPrimaryKey})=>isPrimaryKey).map((col)=>`${tableStructure.tablePref}."${col.columnName}" = "p${col.columnName}"`).join("\n        AND ")}
      RETURNING ${tableStructure.fields.map((col)=>`${tableStructure.tablePref}."${col.columnName}"`).join(", ")};
  END;
$BODY$;`:''}

CREATE FUNCTION "${tableStructure.tableSchema}"."Delete${tableStructure.tableName}"
(
  ${tableStructure.fields.filter(({isPrimaryKey})=>isPrimaryKey).map((col)=>`"p${col.columnName}" ${col.dataType}`).join(",\n  ")}
)
  RETURNS TABLE(${tableStructure.fields.map((col)=>`"${col.columnName}" ${col.dataType}`).join(",\n    ")})
  LANGUAGE 'plpgsql'
AS $BODY$
  BEGIN
    RETURN QUERY
    DELETE FROM "${tableStructure.tableSchema}"."${tableStructure.tableName}" AS ${tableStructure.tablePref}
        WHERE ${tableStructure.fields.filter(({isPrimaryKey})=>isPrimaryKey).map((col)=>`${tableStructure.tablePref}."${col.columnName}" = "p${col.columnName}"`).join("\n        AND ")}
      RETURNING ${tableStructure.fields.map((col)=>`${tableStructure.tablePref}."${col.columnName}"`).join(", ")} ;
  END;
$BODY$;
`);
  };

  contextValue = 'table';
}