import { DefaultNamingStrategy, Table, NamingStrategyInterface } from 'typeorm';

export class FbwNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    foreignKeyName(tableOrName: Table | string, columnNames: string[], referencedTablePath?: string, referencedColumnNames?: string[]): string {
        tableOrName = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;

        const name = columnNames.reduce(
            (name, column) => `${name}_${column}`,
            `${tableOrName}_${referencedTablePath}`,
        );

        return `fk_${name}`;
    }
}
