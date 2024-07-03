import { PgConnect } from "./pgconnect";

export class ConnectionInfo {
    constructor(private connection: PgConnect){}

    getSchemas = (): Promise<any> => this.connection.runQuery(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';`);
    getDatabases = () => this.connection.runQuery(`SELECT datname FROM pg_database WHERE has_database_privilege(current_user, datname, 'CONNECT');`);
    getTables = (schema: string) => this.connection.runQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}';`);
    getStoreProcedure = (schema: string) => this.connection.runQuery(`SELECT p.proname AS function_name FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_proc p ON p.pronamespace = n.oid WHERE n.nspname = '${schema}';`);
    getProcedureSource = (schema: string, tableName: string) => this.connection.runQuery(`
      SELECT pg_get_functiondef(pg_proc.oid) as prosrc
        FROM pg_proc
          INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE proname = '${tableName}' AND nspname = '${schema}';`);
}