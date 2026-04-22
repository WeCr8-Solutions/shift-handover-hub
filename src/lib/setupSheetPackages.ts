export interface SetupSheetPackageItem {
  id: string;
  title: string;
  sheet_type: string;
  revision: string | null;
  created_at: string;
}

export interface SetupSheetPackageGroup<T extends SetupSheetPackageItem = SetupSheetPackageItem> {
  key: string;
  sheetType: string;
  revision: string | null;
  count: number;
  items: T[];
}

export function groupSetupSheetsForPackageView<T extends SetupSheetPackageItem>(
  sheets: T[],
): SetupSheetPackageGroup<T>[] {
  const groups = new Map<string, SetupSheetPackageGroup<T>>();

  for (const sheet of sheets) {
    const revision = sheet.revision?.trim() || null;
    const key = `${sheet.sheet_type}::${revision ?? "unversioned"}`;
    const existing = groups.get(key);

    if (existing) {
      existing.items.push(sheet);
      existing.count += 1;
      continue;
    }

    groups.set(key, {
      key,
      sheetType: sheet.sheet_type,
      revision,
      count: 1,
      items: [sheet],
    });
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      items: group.items.sort((left, right) => {
        const createdAtCompare = right.created_at.localeCompare(left.created_at);
        if (createdAtCompare !== 0) {
          return createdAtCompare;
        }

        return left.title.localeCompare(right.title);
      }),
    }))
    .sort((left, right) => {
      const typeCompare = left.sheetType.localeCompare(right.sheetType);
      if (typeCompare !== 0) {
        return typeCompare;
      }

      if (left.revision === right.revision) {
        return 0;
      }

      if (left.revision === null) {
        return 1;
      }

      if (right.revision === null) {
        return -1;
      }

      return right.revision.localeCompare(left.revision, undefined, { numeric: true });
    });
}