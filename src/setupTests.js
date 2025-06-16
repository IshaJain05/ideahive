import "@testing-library/jest-dom";
const fetch = require("cross-fetch");
global.fetch = fetch;
jest.spyOn(console, "warn").mockImplementation((message) => {
    if (message.includes("React Router Future Flag Warning")) return;
    console.warn(message);
});
