// Update with your config settings.

module.exports = {
  development: {
    client: "mysql",
    connection: {
      host: "127.0.0.1",
      user: "root",
      password: "Escocia150416",
      database: "autius",
    },
  },
  // staging
  production: {
    client: "mysql",
    connection: {
      host: "127.0.0.1",
      port: "3306",
      database: "autiuspruebas",
      user: "autiuspruebas",
      password: "desarrollo2020",
    },
  },
};
