// src/setupTest.js

//fetch mocking example
global.fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
