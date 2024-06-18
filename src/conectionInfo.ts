import { PgConnect } from "./pgconnect";

export class ConnectionInfo {
    constructor(private connection: PgConnect){}

    getSchemas = (): Promise<any> =>  this.connection.runQuery(`SELECT nspname FROM pg_namespace;`);
    getDatabases = () =>  this.connection.runQuery(`SELECT datname FROM pg_database WHERE has_database_privilege(current_user, datname, 'CONNECT');`);
    getTables = (schema: string) =>  this.connection.runQuery(`SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}';`);
    getStoreProcedure = (schema: string) =>  this.connection.runQuery(`SELECT p.proname AS function_name FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_proc p ON p.pronamespace = n.oid WHERE n.nspname = '${schema}';`);
}