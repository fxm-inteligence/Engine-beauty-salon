import { Injectable } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { ambient } from "../transaction-scope";
import { readFilters, type FilterKind, type ListQuery, type Page } from "../list-query";

export interface TreatmentRecord {
  id: string;
  name: string;
  minutes: number;
  price: number;
  createdAt?: Date;
}

function searchWhere(search: string | undefined) {
  if (search === undefined) return undefined;
  return {
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
    ],
  };
}

const FILTER_COLUMNS = new Map<string, FilterKind>([
  ["id", "uuid"],
  ["name", "text"],
  ["minutes", "integer"],
  ["price", "integer"],
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
    case "name":
      return [{ name: direction }, { id: "asc" as const }];
    case "minutes":
      return [{ minutes: direction }, { id: "asc" as const }];
    case "price":
      return [{ price: direction }, { id: "asc" as const }];
    case "createdAt":
      return [{ createdAt: direction }, { id: "asc" as const }];
    default:
      return [{ id: "asc" as const }];
  }
}

@Injectable()
export class TreatmentRepository {
  private readonly prisma = ambient(new PrismaClient());

  findPage(query: ListQuery): Promise<Page<TreatmentRecord>> {
    return Promise.all([
      this.prisma.treatment.findMany({ where: listWhere(query), orderBy: orderBy(query.sort), skip: query.offset, take: query.limit }),
      this.prisma.treatment.count({ where: listWhere(query) }),
    ]).then(([rows, total]) => ({ items: rows, total }));
  }

  findById(id: TreatmentRecord["id"]): Promise<TreatmentRecord | null> {
    return this.prisma.treatment.findUnique({ where: { id } });
  }

  findByField(field: keyof TreatmentRecord & string, value: unknown): Promise<TreatmentRecord | null> {
    return this.prisma.treatment.findFirst({ where: { [field]: value } });
  }

  create(data: Omit<TreatmentRecord, "id">): Promise<TreatmentRecord> {
    return this.prisma.treatment.create({ data });
  }

  update(id: TreatmentRecord["id"], data: Partial<Omit<TreatmentRecord, "id">>): Promise<TreatmentRecord> {
    return this.prisma.treatment.update({ where: { id }, data });
  }

  remove(id: TreatmentRecord["id"]): Promise<TreatmentRecord> {
    return this.prisma.treatment.delete({ where: { id } });
  }
}
