import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ambient } from "../transaction-scope";
import { readFilters, type FilterKind, type ListQuery, type Page } from "../list-query";

export interface BookingRecord {
  id: string;
  treatmentId: string;
  masterId: string;
  clientName: string;
  phone?: string;
  startsAt: Date;
  clientTelegramId?: string;
  status?: string;
  reminded?: boolean;
  createdAt?: Date;
}

function searchWhere(search: string | undefined) {
  if (search === undefined) return undefined;
  return {
    OR: [
      { clientName: { contains: search, mode: "insensitive" as const } },
      { phone: { contains: search, mode: "insensitive" as const } },
      { clientTelegramId: { contains: search, mode: "insensitive" as const } },
      { status: { contains: search, mode: "insensitive" as const } },
    ],
  };
}

const FILTER_COLUMNS = new Map<string, FilterKind>([
  ["id", "uuid"],
  ["treatmentId", "uuid"],
  ["masterId", "uuid"],
  ["clientName", "text"],
  ["phone", "text"],
  ["startsAt", "datetime"],
  ["clientTelegramId", "text"],
  ["status", "text"],
  ["reminded", "boolean"],
  ["createdAt", "datetime"],
]);

function listWhere(query: ListQuery) {
  const conditions: Record<string, unknown>[] = readFilters(query.filters, FILTER_COLUMNS).map(
    ({ field, operator, value }) =>
      value === undefined
        ? { id: { in: [] } }
        : { [field]: operator === "equals" ? value : { [operator]: value } },
  );
  const search = searchWhere(query.search);
  if (search) conditions.push(search);
  return { AND: conditions };
}

function orderBy(sort: ListQuery["sort"]) {
  const direction = sort?.descending ? ("desc" as const) : ("asc" as const);
  switch (sort?.field) {
    case "id":
      return [{ id: direction }];
    case "treatmentId":
      return [{ treatmentId: direction }, { id: "asc" as const }];
    case "masterId":
      return [{ masterId: direction }, { id: "asc" as const }];
    case "clientName":
      return [{ clientName: direction }, { id: "asc" as const }];
    case "phone":
      return [{ phone: direction }, { id: "asc" as const }];
    case "startsAt":
      return [{ startsAt: direction }, { id: "asc" as const }];
    case "clientTelegramId":
      return [{ clientTelegramId: direction }, { id: "asc" as const }];
    case "status":
      return [{ status: direction }, { id: "asc" as const }];
    case "reminded":
      return [{ reminded: direction }, { id: "asc" as const }];
    case "createdAt":
      return [{ createdAt: direction }, { id: "asc" as const }];
    default:
      return [{ id: "asc" as const }];
  }
}

@Injectable()
export class BookingRepository {
  private readonly prisma = ambient(new PrismaClient());

  findPage(query: ListQuery): Promise<Page<BookingRecord>> {
    return Promise.all([
      this.prisma.booking.findMany({ where: listWhere(query), orderBy: orderBy(query.sort), skip: query.offset, take: query.limit }),
      this.prisma.booking.count({ where: listWhere(query) }),
    ]).then(([rows, total]) => ({ items: rows, total }));
  }

  findById(id: BookingRecord["id"]): Promise<BookingRecord | null> {
    return this.prisma.booking.findUnique({ where: { id } });
  }

  findByField(field: keyof BookingRecord & string, value: unknown): Promise<BookingRecord | null> {
    return this.prisma.booking.findFirst({ where: { [field]: value } });
  }

  create(data: Omit<BookingRecord, "id">): Promise<BookingRecord> {
    return this.prisma.booking.create({ data });
  }

  update(id: BookingRecord["id"], data: Partial<Omit<BookingRecord, "id">>): Promise<BookingRecord> {
    return this.prisma.booking.update({ where: { id }, data });
  }

  remove(id: BookingRecord["id"]): Promise<BookingRecord> {
    return this.prisma.booking.delete({ where: { id } });
  }
}
