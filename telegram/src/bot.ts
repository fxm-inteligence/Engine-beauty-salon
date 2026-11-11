import { refusalFor } from "./api/client";
import { book, freeTimes, masters, myBookings, treatments } from "./api/endpoints";
import { formatResult } from "./api/format";
import { SessionStore } from "./session-store";
import { Markup, Telegraf } from "telegraf";

export const bot = new Telegraf(process.env.BOT_TOKEN ?? "");

bot.catch((error) => {
  console.error("A handler failed:", error);
});

const treatmentSession = new SessionStore();

const masterSession = new SessionStore();

bot.command("start", async (ctx) => {
  await ctx.reply("Здравствуйте! Отправьте /book, чтобы записаться, или /mybookings, чтобы увидеть свои записи.");
});

bot.command("mybookings", async (ctx) => {
  let result: unknown;
  try {
    result = await myBookings(String(ctx.from?.id ?? ""));
  } catch (error) {
    console.error("The API call failed:", error);
    await ctx.reply(refusalFor(error, "Записи сейчас недоступны. Попробуйте позже."));
    return;
  }
  await ctx.reply("Ваши записи (время по UTC):\n" + formatResult(result, "startsAt"));
});

bot.command("book", async (ctx) => {
  let result: unknown;
  try {
    result = await treatments();
  } catch (error) {
    console.error("The API call failed:", error);
    await ctx.reply(refusalFor(error, "Записи сейчас недоступны. Попробуйте позже."));
    return;
  }
  await ctx.reply("Выберите услугу:", Markup.inlineKeyboard([...(Array.isArray(result) ? result : []).map((item) => Markup.button.callback(formatResult(item, "name") + ", " + formatResult(item, "price"), "t:" + formatResult(item, "id")))], { columns: 1 }));
});

bot.action(/^t:/, async (ctx) => {
  await ctx.answerCbQuery();
  treatmentSession.set(String(ctx.from?.id), ("data" in ctx.callbackQuery ? ctx.callbackQuery.data : "").slice(2));
  let result: unknown;
  try {
    result = await masters();
  } catch (error) {
    console.error("The API call failed:", error);
    await ctx.reply(refusalFor(error, "Записи сейчас недоступны. Попробуйте позже."));
    return;
  }
  await ctx.reply("Выберите мастера:", Markup.inlineKeyboard([...(Array.isArray(result) ? result : []).map((item) => Markup.button.callback(formatResult(item, "name"), "m:" + formatResult(item, "id")))], { columns: 1 }));
});

bot.action(/^m:/, async (ctx) => {
  await ctx.answerCbQuery();
  masterSession.set(String(ctx.from?.id), ("data" in ctx.callbackQuery ? ctx.callbackQuery.data : "").slice(2));
  await ctx.reply("Выберите день:", Markup.inlineKeyboard([[Markup.button.callback("Сегодня", "d:0"), Markup.button.callback("Завтра", "d:1"), Markup.button.callback("Послезавтра", "d:2")]]));
});

bot.action(/^d:/, async (ctx) => {
  await ctx.answerCbQuery();
  let result: unknown;
  try {
    result = await freeTimes((masterSession.get(String(ctx.from?.id)) ?? ""), new Date(Date.now() + (Number(("data" in ctx.callbackQuery ? ctx.callbackQuery.data : "").slice(2)) || 0) * 86400000).toLocaleDateString("en-CA"), (treatmentSession.get(String(ctx.from?.id)) ?? ""));
  } catch (error) {
    console.error("The API call failed:", error);
    await ctx.reply(refusalFor(error, "Записи сейчас недоступны. Попробуйте позже."));
    return;
  }
  await ctx.reply("Выберите время:", Markup.inlineKeyboard([...(Array.isArray(result) ? result : []).map((item) => Markup.button.callback(formatResult(item, "time"), "h:" + formatResult(item, "start")))], { columns: 3 }));
});

bot.action(/^h:/, async (ctx) => {
  await ctx.answerCbQuery();
  let result: unknown;
  try {
    result = await book({ treatmentId: (treatmentSession.get(String(ctx.from?.id)) ?? ""), masterId: (masterSession.get(String(ctx.from?.id)) ?? ""), startsAt: (("data" in ctx.callbackQuery ? ctx.callbackQuery.data : "").slice(2)), clientTelegramId: String(ctx.from?.id ?? ""), clientName: "Telegram" });
  } catch (error) {
    console.error("The API call failed:", error);
    await ctx.reply(refusalFor(error, "Записи сейчас недоступны. Попробуйте позже."));
    return;
  }
  await ctx.reply("Готово, вы записаны. Отправьте /mybookings, чтобы увидеть свои записи.");
});
