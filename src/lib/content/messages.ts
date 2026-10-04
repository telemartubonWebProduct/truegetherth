import type { z } from "zod";

// Thai validation messages for the people who edit content. Schemas that need a
// specific wording carry their own message (which wins over this map); this
// covers the rest, so an Admin never sees Zod's English defaults.

type Issue = Parameters<z.core.$ZodErrorMap>[0];

function sizeMessage(issue: Issue & { code: "too_small" | "too_big" }): string {
  const small = issue.code === "too_small";
  const limit = Number(small ? issue.minimum : issue.maximum);
  switch (issue.origin) {
    case "string":
      if (small && limit <= 1) return "ต้องกรอกข้อความ";
      return small ? `ต้องมีอย่างน้อย ${limit} ตัวอักษร` : `ยาวได้ไม่เกิน ${limit} ตัวอักษร`;
    case "array":
      if ("exact" in issue && issue.exact) return `ต้องมี ${limit} รายการพอดี`;
      return small ? `ต้องมีอย่างน้อย ${limit} รายการ` : `มีได้ไม่เกิน ${limit} รายการ`;
    case "number":
    case "int":
      if (small) return issue.inclusive ? `ต้องไม่น้อยกว่า ${limit}` : `ต้องมากกว่า ${limit}`;
      return issue.inclusive ? `ต้องไม่เกิน ${limit}` : `ต้องน้อยกว่า ${limit}`;
    default:
      return small ? "ค่าน้อยเกินไป" : "ค่ามากเกินไป";
  }
}

export const thaiErrorMap: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "invalid_type":
      if (issue.input === undefined) return "ต้องกรอกช่องนี้";
      if (issue.expected === "number" && typeof issue.input === "number") return "ต้องเป็นตัวเลข";
      return "ชนิดข้อมูลไม่ถูกต้อง";
    case "too_small":
    case "too_big":
      return sizeMessage(issue);
    case "invalid_format":
      switch (issue.format) {
        case "url":
          return "ลิงก์ไม่ถูกต้อง";
        case "email":
          return "อีเมลไม่ถูกต้อง";
        case "starts_with":
          return `ต้องขึ้นต้นด้วย ${"prefix" in issue ? String(issue.prefix) : ""}`.trim();
        default:
          return "รูปแบบไม่ถูกต้อง";
      }
    case "not_multiple_of":
      return "ตัวเลขไม่ถูกต้อง";
    case "invalid_value":
      return "ค่าที่เลือกไม่อยู่ในรายการ";
    case "unrecognized_keys":
      return `มีช่องที่ระบบไม่รู้จัก: ${issue.keys.join(", ")}`;
    case "invalid_union":
      return "ค่าไม่ตรงกับรูปแบบที่รองรับ";
    case "invalid_key":
    case "invalid_element":
      return "มีรายการที่ไม่ถูกต้อง";
    default:
      return "ค่าไม่ถูกต้อง";
  }
};
