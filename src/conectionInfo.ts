import { PgConnect } from "./pgconnect";

export class ConnectionInfo {
    constructor(private connection: PgConnect){}

    getSchemas = (): Promise<any> =>  this.connection.runQuery(`SELECT nspname FROM pg_namespace;`);
    
    getDatabases = () =>  this.connection.runQuery(`SELECT datname FROM pg_database WHERE has_database_privilege(current_user, datname, 'CONNECT');`);
}