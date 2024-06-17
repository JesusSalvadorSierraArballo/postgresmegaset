import pg from 'pg';

export class PgConnect {
    constructor(user: string, password: string, host: string = 'localhost', port: number = 5432) {
        this.user = user;
        this.password = password;
        this.host = host;
        this.port = port;
        //this.database = database;
    }

    user: string = ''; 
    password: string = ''; 
    host: string = 'localhost'; 
    port: number = 5432; 
    //database: string = '';


    async testConnection(): Promise<boolean> {
      try {
        const { Client } = pg;
        const c = new Client({
            user: this.user,
            password: this.password,
            host: this.host,
            port: this.port,
            database: 'postgres',
        });
        await c.connect();
        await c.end();
        return true;
      } catch(e) {
        return false;
      }
    }
}