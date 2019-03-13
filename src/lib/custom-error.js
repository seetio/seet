module.exports = class SeetCustomError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SeetCustomError';
    }
}