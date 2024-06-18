import pg from 'pg';

export class PgConnect {
    constructor(user: string, password: string, host: string = 'localhost', port: number = 5432, database='postgres') {
        this.user = user;
        this.password = password;
        this.host = host;
        this.port = port;
        this.database = database;
    }

    user: string = ''; 
    password: string = ''; 
    host: string = 'localhost'; 
    port: number = 5432; 
    database: string = '';

    async testConnection(): Promise<boolean> {
      try {
        const { Client } = pg;
        const c = new Client({
            user: this.user,
            password: this.password,
            host: this.host,
            port: this.port,
            database: this.database,
        });
        await c.connect();
        await c.end();
        return true;
      } catch(e) {
        return false;
      }
    }

    async runQuery(query: string): Promise<any> {
      const { Client } = pg;
      const c = new Client({
        user: this.user,
        password: this.password,
        host: this.host,
        port: this.port,
        database: 'postgres',
      });

    await c.connect();
    const res = await c.query(query);
    return res;
    }
}