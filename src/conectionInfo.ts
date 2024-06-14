class ConnectionInfo { 
    getDatabases = () => `SELECT datname FROM pg_database WHERE has_database_privilege(current_user, datname, 'CONNECT');`;
}