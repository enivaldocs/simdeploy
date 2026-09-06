import pc from "picocolors";

export const check = (message: string): void => {
  console.log(`${pc.green("OK")}  ${message}`);
};

export const fail = (message: string): void => {
  console.error(`${pc.red("ERR")} ${message}`);
};

export const info = (message: string): void => {
  console.log(`    ${pc.dim(message)}`);
};

export const heading = (): void => {
  console.log(`\n${pc.bold("SimDeploy")}\n`);
};

export const money = (usd: number): string => pc.bold(`USD ${usd.toFixed(2)}/month`);

export function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}
