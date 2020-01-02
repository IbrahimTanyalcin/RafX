module.exports = {
    launch: {
        headless: process.env.HEADLESS === undefined ? true : process.env.HEADLESS,
        slowMo: process.env.SLOWMO ? process.env.SLOWMO : 0,
        devtools: true
    }
}