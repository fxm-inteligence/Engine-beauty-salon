"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiData, useApiWrite } from "@/lib/use-api-data";
import { motion } from "framer-motion";
import { FormEvent } from "react";

export default function HomePage() {
  const treatments = useApiData<Record<string, unknown>[]>("/treatments?sort=-createdAt");
  const addBooking = useApiWrite("/bookings", "POST");
  const treatmentIdOptions = useApiData<Record<string, unknown>[]>("/treatments");
  const masterIdOptions = useApiData<Record<string, unknown>[]>("/masters");
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = {
      "startsAt": String(data.get("startsAt") ?? ""),
      "phone": String(data.get("phone") ?? ""),
      "clientName": String(data.get("clientName") ?? ""),
      "masterId": String(data.get("masterId") ?? ""),
      "treatmentId": String(data.get("treatmentId") ?? ""),
    };
    try {
      await addBooking.run(values);
      await treatments.reload();
      await treatmentIdOptions.reload();
      await masterIdOptions.reload();
      form.reset();
    } catch {
      // Surfaced through the Write Block's `error`.
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <form onSubmit={onSubmit}><p>Выберите услугу, мастера и время. Записаться можно и в нашем Telegram-боте.</p><Table><TableHeader><TableRow><TableHead>Название</TableHead><TableHead>Минут</TableHead><TableHead>Цена</TableHead></TableRow></TableHeader><TableBody>{treatments.loading ? (<TableRow><TableCell>Loading…</TableCell></TableRow>) : treatments.error ? (<TableRow><TableCell>{treatments.error.message}</TableCell></TableRow>) : (treatments.data ?? []).length === 0 ? (<TableRow><TableCell>No records yet.</TableCell></TableRow>) : null}{(treatments.data ?? []).map((row, index) => (<TableRow key={index}>{["name", "minutes", "price"].map((key) => (<TableCell key={key}>{String(row[key] ?? "")}</TableCell>))}</TableRow>))}</TableBody></Table><label className="flex flex-col gap-1 text-sm"><span>Услуга</span><select className="rounded-md border px-3 py-2" name="treatmentId"><option value=""></option>{(treatmentIdOptions.data ?? []).map((row, index) => (<option key={index} value={String(row["id"] ?? "")}>{String(row["name"] ?? row["id"] ?? "")}</option>))}</select></label><label className="flex flex-col gap-1 text-sm"><span>Мастер</span><select className="rounded-md border px-3 py-2" name="masterId"><option value=""></option>{(masterIdOptions.data ?? []).map((row, index) => (<option key={index} value={String(row["id"] ?? "")}>{String(row["name"] ?? row["id"] ?? "")}</option>))}</select></label><label className="flex flex-col gap-1 text-sm"><span>Ваше имя</span><Input name="clientName" /></label><label className="flex flex-col gap-1 text-sm"><span>Телефон</span><Input name="phone" /></label><label className="flex flex-col gap-1 text-sm"><span>Дата и время</span><Input type="datetime-local" name="startsAt" /></label><Button type="submit">Записаться</Button>{addBooking.error && <p className="text-sm text-red-500">{addBooking.error.message}</p>}</form>
    </motion.div>
  );
}
