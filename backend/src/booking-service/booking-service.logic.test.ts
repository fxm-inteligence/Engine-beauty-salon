import { strict as assert } from "node:assert";
import { test } from "node:test";
import { ConflictException } from "@nestjs/common";
import { withHooks } from "../with-hooks";
import { flowBookingStepsAllows, holidaysOf, keepAudit, keepHistory, lockSlots, logicHooks, reactionRemindClientFires, reactionRemindClientMessage, reactionRemindClientRun, reactionTellBookedFires, reactionTellBookedMessage, reactionTellBookedRun, slotInHours, slotsCrowded, workHoursOf } from "./booking-service.logic";

type Row = Record<string, any>;

/** Runs `work` the way a test without a database runs: a length that lives in another table is the default. */
async function withoutDatabase<T>(work: () => Promise<T>): Promise<T> {
  const saved = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    return await work();
  } finally {
    if (saved !== undefined) process.env.DATABASE_URL = saved;
  }
}

/** A Service whose Repository keeps `rows` in memory. */
function serviceWith(rows: Row[]) {
  const repository = {
    findPage: async () => ({ items: rows, total: rows.length }),
    findById: async (id: unknown) => rows.find((row) => row["id"] === id) ?? null,
  };
  return { bookingRepository: repository };
}

async function slotMasterFreeAttempt(rows: Row[], candidate: Row, id?: unknown): Promise<void> {
  await withoutDatabase(() => (logicHooks.before as any)["createBooking"].call(serviceWith(rows), candidate));
}

test("slotMasterFree: slotInHours: an hour inside a working day fits", () => {
  const span = { start: new Date("2030-07-01T14:00:00.000Z"), end: new Date("2030-07-01T15:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), true);
});

test("slotMasterFree: slotInHours: summer time is told from the zone: nine in the morning is 13:00 UTC", () => {
  const span = { start: new Date("2030-07-01T13:00:00.000Z"), end: new Date("2030-07-01T14:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), true);
});

test("slotMasterFree: slotInHours: winter time is told from the zone: nine in the morning is 14:00 UTC", () => {
  const span = { start: new Date("2030-01-14T14:00:00.000Z"), end: new Date("2030-01-14T15:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), true);
});

test("slotMasterFree: slotInHours: a start before the opening does not fit", () => {
  const span = { start: new Date("2030-07-01T12:30:00.000Z"), end: new Date("2030-07-01T13:30:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: slotInHours: an end after the closing does not fit", () => {
  const span = { start: new Date("2030-07-01T20:30:00.000Z"), end: new Date("2030-07-01T21:30:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: slotInHours: an end exactly at the closing fits", () => {
  const span = { start: new Date("2030-07-01T20:00:00.000Z"), end: new Date("2030-07-01T21:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), true);
});

test("slotMasterFree: slotInHours: a day off does not fit", () => {
  const span = { start: new Date("2030-07-06T15:00:00.000Z"), end: new Date("2030-07-06T16:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: slotInHours: a holiday of one date does not fit", () => {
  const span = { start: new Date("2030-07-04T15:00:00.000Z"), end: new Date("2030-07-04T16:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: slotInHours: a holiday of every year does not fit", () => {
  const span = { start: new Date("2031-12-25T15:00:00.000Z"), end: new Date("2031-12-25T16:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: slotInHours: the break of a day does not fit", () => {
  const span = { start: new Date("2030-07-02T16:30:00.000Z"), end: new Date("2030-07-02T17:30:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: slotInHours: the hour after the break fits", () => {
  const span = { start: new Date("2030-07-02T17:00:00.000Z"), end: new Date("2030-07-02T18:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), true);
});

test("slotMasterFree: slotInHours: the day is the day of the zone, not of UTC", () => {
  const span = { start: new Date("2030-07-02T01:00:00.000Z"), end: new Date("2030-07-02T02:00:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: slotInHours: a record that crosses the interval is refused", () => {
  const span = { start: new Date("2030-07-02T15:30:00.000Z"), end: new Date("2030-07-02T17:30:00.000Z") };
  assert.equal(slotInHours(span, "America/New_York", [[[540,1020]],[[540,720],[780,1020]],[[540,1020]],[[540,1020]],[[540,1020]],[],[]], ["2030-07-04","12-25"]), false);
});

test("slotMasterFree: workHoursOf: a weekday morning fits", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-01-07T10:00:00.000Z"), end: new Date("2030-01-07T11:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("")), true);
});

test("slotMasterFree: workHoursOf: the break in the middle of the day does not fit", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-01-07T13:00:00.000Z"), end: new Date("2030-01-07T14:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("")), false);
});

test("slotMasterFree: workHoursOf: a Saturday has its own hours", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-01-12T11:00:00.000Z"), end: new Date("2030-01-12T12:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("")), true);
});

test("slotMasterFree: workHoursOf: after the closing of a Saturday does not fit", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-01-12T15:00:00.000Z"), end: new Date("2030-01-12T16:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("")), false);
});

test("slotMasterFree: workHoursOf: a day with no hours written is a day off", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-01-13T10:00:00.000Z"), end: new Date("2030-01-13T11:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("")), false);
});

test("slotMasterFree: workHoursOf: a day in a stretch of days off does not fit", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-07-08T10:00:00.000Z"), end: new Date("2030-07-08T11:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("2030-07-01..2030-07-14")), false);
});

test("slotMasterFree: workHoursOf: the day after a stretch of days off fits", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-07-15T10:00:00.000Z"), end: new Date("2030-07-15T11:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("2030-07-01..2030-07-14")), true);
});

test("slotMasterFree: workHoursOf: a day off of every year does not fit", () => {
  const days = workHoursOf("mon-fri 09:00-13:00 14:00-18:00; sat 10:00-14:00");
  assert.ok(days);
  const span = { start: new Date("2030-12-25T10:00:00.000Z"), end: new Date("2030-12-25T11:00:00.000Z") };
  assert.equal(slotInHours(span, "UTC", days, holidaysOf("nonsense, 12-25")), false);
});

test("slotMasterFree: workHoursOf: hours it cannot read leave the block's own", () => {
  for (const text of ["","funday 09:00-18:00","mon 18:00-09:00","mon-fri"]) assert.equal(workHoursOf(text), undefined);
});

test("slotMasterFree: slotsCrowded: time shared with another is crowded", () => {
  const span = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });
  const taken = [span("2030-01-01T10:30:00.000Z", "2030-01-01T11:30:00.000Z")];
  assert.equal(slotsCrowded(span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), taken, 1, 0), true);
});

test("slotMasterFree: slotsCrowded: a start right when the other ends is not", () => {
  const span = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });
  const taken = [span("2030-01-01T11:00:00.000Z", "2030-01-01T12:00:00.000Z")];
  assert.equal(slotsCrowded(span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), taken, 1, 0), false);
});

test("slotMasterFree: slotsCrowded: one taken place of two leaves room", () => {
  const span = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });
  const taken = [span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z")];
  assert.equal(slotsCrowded(span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), taken, 2, 0), false);
});

test("slotMasterFree: slotsCrowded: two records at the same time fill a capacity of two", () => {
  const span = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });
  const taken = [span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), span("2030-01-01T10:30:00.000Z", "2030-01-01T11:30:00.000Z")];
  assert.equal(slotsCrowded(span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), taken, 2, 0), true);
});

test("slotMasterFree: slotsCrowded: records one after the other never fill a capacity of two", () => {
  const span = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });
  const taken = [span("2030-01-01T09:30:00.000Z", "2030-01-01T10:30:00.000Z"), span("2030-01-01T10:30:00.000Z", "2030-01-01T11:30:00.000Z")];
  assert.equal(slotsCrowded(span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), taken, 2, 0), false);
});

test("slotMasterFree: slotsCrowded: a buffer widens every taken span on both sides", () => {
  const span = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });
  const taken = [span("2030-01-01T11:10:00.000Z", "2030-01-01T11:40:00.000Z")];
  assert.equal(slotsCrowded(span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), taken, 1, 15), true);
});

test("slotMasterFree: slotsCrowded: a gap as wide as the buffer is enough", () => {
  const span = (start: string, end: string) => ({ start: new Date(start), end: new Date(end) });
  const taken = [span("2030-01-01T11:15:00.000Z", "2030-01-01T11:40:00.000Z")];
  assert.equal(slotsCrowded(span("2030-01-01T10:00:00.000Z", "2030-01-01T11:00:00.000Z"), taken, 1, 15), false);
});

test("slotMasterFree: a record that overlaps another is refused with 409", async () => {
  await assert.rejects(() => slotMasterFreeAttempt([{"id":"existing","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-a","treatmentId":"length-key"}], {"id":"new","startsAt":"2030-01-07T07:30:00.000Z","masterId":"resource-a","treatmentId":"length-key"}), ConflictException);
});

test("slotMasterFree: a record that starts when the other ends is accepted", async () => {
  await slotMasterFreeAttempt([{"id":"existing","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-a","treatmentId":"length-key"}], {"id":"new","startsAt":"2030-01-07T08:00:00.000Z","masterId":"resource-a","treatmentId":"length-key"});
});

test("slotMasterFree: another masterId is free at the same time", async () => {
  await slotMasterFreeAttempt([{"id":"existing","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-a","treatmentId":"length-key"}], {"id":"new","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-b","treatmentId":"length-key"});
});

test("slotMasterFree: a record with the status cancelled does not block the time", async () => {
  await slotMasterFreeAttempt([{"id":"existing","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-a","treatmentId":"length-key","status":"cancelled"}], {"id":"new","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-a","treatmentId":"length-key"});
});

test("slotMasterFree: a record inside the working hours is accepted", async () => {
  await slotMasterFreeAttempt([], {"id":"new","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-a","treatmentId":"length-key"});
});

test("slotMasterFree: a record before the working hours is refused with 409", async () => {
  await assert.rejects(() => slotMasterFreeAttempt([], {"id":"new","startsAt":"2030-01-07T06:30:00.000Z","masterId":"resource-a","treatmentId":"length-key"}), ConflictException);
});

test("slotMasterFree: two requests for the same time at once, one is saved and the other refused with 409", async () => {
  const rows: Row[] = [];
  const repository = serviceWith(rows).bookingRepository;
  const service = lockSlots(
    withHooks(
      {
    bookingRepository: repository,
    async createBooking(body: Row) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      rows.push(body);
      return body;
    },
      },
      logicHooks as any,
    ),
  );
  const settled = await withoutDatabase(() => Promise.allSettled([service.createBooking({"id":"first","startsAt":"2030-01-07T07:00:00.000Z","masterId":"resource-a","treatmentId":"length-key"}), service.createBooking({"id":"second","startsAt":"2030-01-07T07:30:00.000Z","masterId":"resource-a","treatmentId":"length-key"})]));
  assert.equal(settled.filter((result) => result.status === "fulfilled").length, 1);
  const refused = settled.find((result) => result.status === "rejected") as PromiseRejectedResult;
  assert.ok(refused.reason instanceof ConflictException);
});

test("flowBookingSteps: new may change to confirmed", () => {
  assert.equal(flowBookingStepsAllows("new", "confirmed"), true);
});

test("flowBookingSteps: new may not change to done", () => {
  assert.equal(flowBookingStepsAllows("new", "done"), false);
});

test("flowBookingSteps: a status the flow does not list is not checked", () => {
  assert.equal(flowBookingStepsAllows("not-in-the-flow", "new"), true);
  assert.equal(flowBookingStepsAllows(undefined, "new"), true);
});

test("flowBookingSteps: updateBooking: a change the flow does not allow is refused with 409", async () => {
  const service = serviceWith([{ "id": "a", "status": "new" }]);
  await assert.rejects(async () => (logicHooks.before as any)["updateBooking"].call(service, "a", { "status": "done" }), ConflictException);
});

test("flowBookingSteps: updateBooking: a change the flow allows goes through", async () => {
  const service = serviceWith([{ "id": "a", "status": "new" }]);
  await (logicHooks.before as any)["updateBooking"].call(service, "a", { "status": "confirmed" });
});

test("flowBookingSteps: patchBooking: a change the flow does not allow is refused with 409", async () => {
  const service = serviceWith([{ "id": "a", "status": "new" }]);
  await assert.rejects(async () => (logicHooks.before as any)["patchBooking"].call(service, "a", { "status": "done" }), ConflictException);
});

test("flowBookingSteps: patchBooking: a change the flow allows goes through", async () => {
  const service = serviceWith([{ "id": "a", "status": "new" }]);
  await (logicHooks.before as any)["patchBooking"].call(service, "a", { "status": "confirmed" });
});

test("reactionTellBooked: Tell Booked: follows a record that meets its conditions", () => {
  assert.equal(reactionTellBookedFires(null, {"id":"r1","clientTelegramId":"set"}), true);
});

test("reactionTellBooked: Tell Booked: does not follow a record that breaks a condition", () => {
  assert.equal(reactionTellBookedFires(null, {"id":"r1","clientTelegramId":""}), false);
});

test("reactionTellBooked: Tell Booked: sends the messenger to the address of the record, and nothing without one", async () => {
  const sent: any[] = [];
  const client = {
    sendMessage: async (message: any) => void sent.push(message),
  };
  await reactionTellBookedRun(client, {"id":"r1","clientTelegramId":"set"});
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "4242");
  assert.equal(sent[0].text, reactionTellBookedMessage({"id":"r1","clientTelegramId":"set"}, (value) => String(value ?? "")));
  sent.length = 0;
  await reactionTellBookedRun(client, {"id":"r1","clientTelegramId":""});
  assert.equal(sent.length, 0);
});

test("reactionRemindClient: Remind Client: follows a record that meets its conditions", () => {
  assert.equal(reactionRemindClientFires({"id":"r1","clientTelegramId":"set","status":"cancelled-other"}, {"id":"r1","clientTelegramId":"set","status":"cancelled-other"}), true);
});

test("reactionRemindClient: Remind Client: does not follow a record that breaks a condition", () => {
  assert.equal(reactionRemindClientFires({"id":"r1","clientTelegramId":"set","status":"cancelled-other"}, {"id":"r1","clientTelegramId":"set","status":"cancelled"}), false);
});

test("reactionRemindClient: Remind Client: sends the messenger to the address of the record, and nothing without one", async () => {
  const sent: any[] = [];
  const client = {
    sendMessage: async (message: any) => void sent.push(message),
  };
  await reactionRemindClientRun(client, {"id":"r1","clientTelegramId":"set","status":"cancelled-other"});
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "4242");
  assert.equal(sent[0].text, reactionRemindClientMessage({"id":"r1","clientTelegramId":"set","status":"cancelled-other"}, (value) => String(value ?? "")));
  sent.length = 0;
  await reactionRemindClientRun(client, {"id":"r1","clientTelegramId":"","status":"cancelled-other"});
  assert.equal(sent.length, 0);
});

test("flowBookingSteps: history: a created record starts it, a changed status adds a row, an unchanged one adds nothing", async () => {
  const rows: Row[] = [{ "id": "a", "status": "new" }];
  const kept: Row[] = [];
  const log = { create: async (row: Row) => (kept.push(row), row) };
  const service = keepHistory({
    ...serviceWith(rows),
    bookingStatusLogRepository: log,
    async createBooking(body: Row) {
      const created = { "id": "b", ...body };
      rows.push(created);
      return created;
    },
    async updateBooking(id: unknown, body: Row) {
      // A new object, not a change in place: the history reads the old record before the call and must see the old status.
      const index = rows.findIndex((row) => row["id"] === id);
      rows[index] = { ...(rows[index] as Row), ...body };
      return rows[index];
    },
  });
  await service.createBooking({ "status": "new" });
  await service.updateBooking("a", { "status": "not-in-the-flow" });
  await service.updateBooking("a", { "status": "not-in-the-flow" });
  const withoutTime = kept.map(({ "changedAt": changedAt, ...rest }) => (assert.equal(typeof changedAt, "number"), rest));
  assert.deepEqual(withoutTime, [{ "recordId": "b", "fromStatus": "", "toStatus": "new" }, { "recordId": "a", "fromStatus": "new", "toStatus": "not-in-the-flow" }]);
});

test("auditBookingLog: audit: a created record, a changed field, an unchanged call and a deleted record each leave a row; a field left out never does", async () => {
  const auditauditBookingLogRows: Row[] = [{ "id": "a", "clientName": "old" }];
  const kept: Row[] = [];
  const log = { create: async (entry: Row) => (kept.push(entry), entry) };
  const service = keepAudit({
    ...serviceWith(auditauditBookingLogRows),
    bookingAuditLogRepository: log,
    async createBooking(body: Row) {
      const created = { "id": "b", ...body };
      auditauditBookingLogRows.push(created);
      return created;
    },
    async updateBooking(id: unknown, body: Row) {
      const index = auditauditBookingLogRows.findIndex((row) => row["id"] === id);
      auditauditBookingLogRows[index] = { ...(auditauditBookingLogRows[index] as Row), ...body };
      return auditauditBookingLogRows[index];
    },
    async deleteBooking(id: unknown) {
      auditauditBookingLogRows.splice(auditauditBookingLogRows.findIndex((row) => row["id"] === id), 1);
      return true;
    },
  });
  await service.createBooking({ "clientName": "fresh" });
  await service.updateBooking("a", { "clientName": "new" });
  await service.updateBooking("a", { "clientName": "new" });
  await service.deleteBooking("a");
  const withoutTime = kept.map(({ "changedAt": changedAt, ...rest }) => (assert.equal(typeof changedAt, "number"), rest));
  assert.deepEqual(withoutTime, [{ "recordId": "b", "action": "create", "actor": "", "changes": JSON.stringify({ "id": { to: "b" }, "clientName": { to: "fresh" } }) }, { "recordId": "a", "action": "update", "actor": "", "changes": JSON.stringify({ "clientName": { from: "old", to: "new" } }) }, { "recordId": "a", "action": "delete", "actor": "", "changes": JSON.stringify({ "id": { from: "a" }, "clientName": { from: "new" } }) }]);
});
