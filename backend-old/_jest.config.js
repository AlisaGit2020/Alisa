// _jest.config.js
export default {
    // ...
    "transform": {
        "^.+\\.ts$": "ts-jest",
    },
    testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/dist/"],
    // ...
};
