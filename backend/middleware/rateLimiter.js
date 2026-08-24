// MIT License — Luna AI Web | Built by Ravikiran (github.com/R22-b)
const rateLimit = require('express-rate-limit');

const make = (max, windowMs = 60 * 1000) => rateLimit({
  windowMs, max,
  message: { error: 'Too many requests. Please wait a moment.', retryAfter: Math.ceil(windowMs / 1000) },
  standardHeaders: true, legacyHeaders: false,
});

module.exports = {
  chat:     make(30),
  image:    make(10),
  documents: make(5),
  research: make(10),
  student:  make(10),
};
