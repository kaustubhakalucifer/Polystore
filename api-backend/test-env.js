const { validateSync } = require('class-validator');
const { plainToInstance } = require('class-transformer');
const { EnvironmentDto } = require('./dist/config/environment.dto.js');
const VALID_KEY = 'a'.repeat(64);
const validConfig = {
  MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/testdb',
  ENCRYPTION_KEY: VALID_KEY,
  JWT_SECRET: 'test-secret',
  SMTP_HOST: 'smtp.example.com',
  SMTP_PORT: '587',
  SMTP_USER: 'user',
  SMTP_PASS: 'pass',
  SMTP_FROM: 'noreply@example.com',
  PORT: '3000',
  NODE_ENV: 'development',
};
const dto = plainToInstance(EnvironmentDto, validConfig);
const errors = validateSync(dto);
console.log(errors);
