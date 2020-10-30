import { DefaultNamingStrategy, Table, NamingStrategyInterface } from "typeorm";

export class FbwNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
  foreignKeyName(tableOrName: Table | string, columnNames: string[], referencedTablePath?: string, referencedColumnNames?: string[]): string {

    tableOrName =
      typeof tableOrName === "string" ? tableOrName : tableOrName.name;

    const name = columnNames.reduce(
      (name, column) => `${name}_${column}`,
      `${tableOrName}_${referencedTablePath}`,
    );

    return`fk_${name}`
    // TODO: Hash it? Long names can cause issues
    // return`fk_${crypto.createHash('md5').update(name).digest("hex")}`
  }
}