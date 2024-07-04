import { PgConnect } from "./pgconnect";

export class ConnectionInfo {
    constructor(private connection: PgConnect){}

    getSchemas = (): Promise<any> => this.connection.runQuery(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';`);
    getDatabases = () => this.connection.runQuery(`SELECT datname FROM pg_database WHERE has_database_privilege(current_user, datname, 'CONNECT');`);
    getTables = (schema: string) => this.connection.runQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}';`);
    getStoreProcedure = (schema: string) => this.connection.runQuery(`SELECT p.proname AS function_name FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_proc p ON p.pronamespace = n.oid WHERE n.nspname = '${schema}';`);
    //TODO: CAMBIAR POR EL QUERY MATÓN
    getTablesStructure = (schema: string, table: string) => this.connection.runQuery(`
      WITH tb_campos AS (
        Select
          col.TABLE_SCHEMA as "schema",
          col.TABLE_NAME AS "table",
          col.COLUMN_NAME as "column",
          col.IS_NULLABLE,
          col.DATA_TYPE as "dataType",
          col.ordinal_position,
          concat(upper(col.DATA_TYPE ),
          '(' ,
          COALESCE( col.CHARACTER_MAXIMUM_LENGTH, col.numeric_precision),
          CASE
              WHEN col.numeric_precision > 0 THEN
              CONCAT( ',' , col.numeric_scale)
              ELSE
                ''
            END
        , ')')
          tipo_presicion,
          COALESCE( col.CHARACTER_MAXIMUM_LENGTH, col.numeric_precision) as numericPrecision,
          col.numeric_scale,
            CASE
                  WHEN COALESCE(col.numeric_scale, 0) = 0 AND col.data_type = 'int' THEN
                    1
                  ELSE
                    0
                END
                  es_integer,
            CASE
                  WHEN col.data_type = 'text' THEN
                    1
                  ELSE
                    0
                END
                  "isString",
            CASE
                  WHEN COALESCE(col.numeric_scale, 0) = 0 AND col.data_type = 'bit' THEN
                    1
                  ELSE
                    0
                END
                  es_bit,
            CASE WHEN COALESCE(col.numeric_scale, 0) = 0 AND (col.data_type = 'datetime' or col.data_type = 'DATE') 
            THEN 1 ELSE 0 END isDate,
          case when exists (
            select * from INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
              left join information_schema.TABLE_CONSTRAINTS tc
                on tc.table_schema = ccu.table_schema
                and tc.table_name = ccu.table_name
                and tc.constraint_name = ccu.constraint_name
                and col.table_schema = ccu.table_schema
                and col.table_name = ccu.table_name
                and col.column_name = ccu.column_name
              where tc.constraint_type = 'PRIMARY KEY'
          ) then 1 else 0 end  as "isPrimaryKey",
          case when exists (
            select * from information_schema.TABLE_CONSTRAINTS tc
            inner join INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
            on tc.constraint_name = ccu.constraint_name
            where  col.table_schema = tc.table_schema
            and col.table_name = tc.table_name
            and col.column_name = ccu.column_name
            and constraint_type = 'FOREIGN KEY'
          ) then 1 else 0 end  as "isForeignKey",
            col.ordinal_position posicion_primary
              from INFORMATION_SCHEMA.COLUMNS col),
                  req_seq AS
          (SELECT "table", "column"
          FROM   (SELECT "table",
                        "column",
                        es_integer--,
                  FROM   tb_campos
                  WHERE  "isPrimaryKey" = 1) tab
          WHERE  es_integer = 1 ),
        relacion_constraints as (
        select  ori.TABLE_CATALOG catalogo_origen, ori.TABLE_SCHEMA shema_origen, ori.TABLE_NAME tabla_origen, ori.COLUMN_NAME columna_origen,
          const.CONSTRAINT_NAME, const.UNIQUE_CONSTRAINT_NAME,
          dest.TABLE_CATALOG catalogo_destino, dest.TABLE_SCHEMA "schemaDestination", dest.TABLE_NAME "tableDestination", dest.COLUMN_NAME columna_destino
        from information_schema.key_column_usage ori
          inner join INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS const
            on ori.CONSTRAINT_NAME = const.CONSTRAINT_NAME
          inner join information_schema.key_column_usage dest
            on const.UNIQUE_CONSTRAINT_NAME = dest.CONSTRAINT_NAME
        )
          SELECT tb_campos.*,
        rc.*,
        (select column_name
          from INFORMATION_SCHEMA.COLUMNS where ordinal_position = 2
          and table_name = rc."tableDestination" and table_schema = rc."schemaDestination"
        ) as "secondColumn",
          CASE
            WHEN req_seq.table IS NOT NULL THEN 1
            ELSE 0
          END
            requiere_secuencia,
          CASE
            WHEN TRIM(LOWER(tb_campos.column)) IN
                    ('estatus', 'status') THEN
              1
            ELSE
              0
          END
            "isStatus",
          CASE WHEN is_nullable = 'YES' THEN 1 ELSE 0 END nullable

          FROM tb_campos
          LEFT JOIN
          req_seq
            ON req_seq.table = tb_campos.table
            AND req_seq.column = tb_campos.column
        left join relacion_constraints rc
          on tb_campos."isForeignKey" = 1
          and tb_campos."schema" = rc.shema_origen
          and tb_campos.column = rc.columna_origen
        WHERE    LOWER(tb_campos.table) LIKE lower(COALESCE('${table}', '%'))
        and     LOWER(tb_campos."schema") LIKE lower(COALESCE('${schema}', '%'))
        ORDER BY tb_campos.table, posicion_primary
`);
    getProcedureSource = (schema: string, tableName: string) => this.connection.runQuery(`
      SELECT pg_get_functiondef(pg_proc.oid) as prosrc
        FROM pg_proc
          INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE proname = '${tableName}' AND nspname = '${schema}';`);
}