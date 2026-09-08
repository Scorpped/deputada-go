module.exports = {
    apps: [
        {
            name: "dashboardadmin",
            script: "npm",
            args: "run preview",
            env: {
                PORT: 3001,
                NODE_ENV: "production"
            }
        }
    ]
};
