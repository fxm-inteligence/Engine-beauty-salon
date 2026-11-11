import * as api from "./client";

/** GET /bookings?clientTelegramId=:id */
export function myBookings(id: string, token?: string): Promise<unknown> {
  return api.request(`/bookings?clientTelegramId=${encodeURIComponent(id)}`, { token });
}

/** GET /treatments */
export function treatments(token?: string): Promise<unknown> {
  return api.request("/treatments", { token });
}

/** GET /masters */
export function masters(token?: string): Promise<unknown> {
  return api.request("/masters", { token });
}

/** GET /bookings/free?masterId=:master&date=:date&lengthKey=:treatment */
export function freeTimes(master: string, date: string, treatment: string, token?: string): Promise<unknown> {
  return api.request(`/bookings/free?masterId=${encodeURIComponent(master)}&date=${encodeURIComponent(date)}&lengthKey=${encodeURIComponent(treatment)}`, { token });
}

/** POST /bookings */
export function book(body?: unknown, token?: string): Promise<unknown> {
  return api.request("/bookings", { method: "POST", json: body, token });
}
