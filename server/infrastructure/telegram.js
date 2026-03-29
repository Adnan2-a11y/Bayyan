import { Telegraf } from 'telegraf';
import 'dotenv/config';

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  throw new Error('❌ BOT_TOKEN not found in environment');
}

const bot = new Telegraf(botToken);

export default bot;
