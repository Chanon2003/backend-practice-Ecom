import rateLimit from 'express-rate-limit';


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 5,
  message: `Too many attempts, please try again later: 15 mins.`,
});

export default limiter;
