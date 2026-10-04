import type { CatalogPackage, LocalizedText } from "@/lib/content/schema";

import type { BenefitId } from "../benefits";
import type { MediaId } from "../media";

// Packages were imported from the old site's data files (commit 87c70d2). Every
// imported package needs the business to confirm its current price and terms
// before launch; "hidden" packages are duplicates or contradict themselves and
// stay off the public pages until fixed. Review notes are in Thai for the owner.

export const t = (th: string, en: string): LocalizedText => ({ th, en });

export const days = (n: number) => t(`${n} วัน`, n === 1 ? "1 day" : `${n} days`);

export const autoRenew = t("ต่ออายุอัตโนมัติ", "Renews automatically");

export const contractMonths = (n: number) => t(`${n} เดือน`, `${n} months`);

const importedNote = "นำเข้าจากเว็บเดิม: ธุรกิจต้องยืนยันราคาและเงื่อนไขปัจจุบันก่อนเปิดใช้งาน";

type Draft = Omit<CatalogPackage, "benefits" | "details" | "conditions" | "review" | "source" | "image"> & {
  benefits?: BenefitId[];
  details?: LocalizedText[];
  conditions?: LocalizedText[];
  image?: MediaId;
  /** Legacy file under src/datas (removed in M2; see commit 87c70d2) and the export/entry the record came from. */
  from: [file: string, entry: string];
  /** Extra review notes (Thai). */
  notes?: string[];
  /** Duplicate or self-contradicting record: keep for review, hide from visitors. */
  hide?: string;
};

export function pkg({ from, notes = [], hide, benefits = [], details = [], conditions = [], ...rest }: Draft): CatalogPackage {
  return {
    ...rest,
    benefits,
    details,
    conditions,
    source: { file: `src/datas/${from[0]}`, entry: from[1] },
    review: hide
      ? { status: "hidden", notes: [hide, ...notes] }
      : { status: "unverified", notes: [importedNote, ...notes] },
  };
}
