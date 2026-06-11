module.exports = {
  apps: [
    {
      name: "mabrig-backend",
      script: "server.js",
      instances: "max",        // one per CPU core
      exec_mode: "cluster",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      max_memory_restart: "512M",
    },
  ],
};
