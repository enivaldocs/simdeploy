import { execFileSync } from "node:child_process";

export interface GitInfo {
  commitSha?: string;
  commitMessage?: string;
  branch?: string;
}

function git(args: string[], cwd: string): string | undefined {
  try {
    return execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "ignore"] })
      .toString("utf8")
      .trim();
  } catch {
    return undefined;
  }
}

export function readGitInfo(cwd: string): GitInfo {
  return {
    commitSha: git(["rev-parse", "HEAD"], cwd),
    commitMessage: git(["log", "-1", "--format=%s"], cwd),
    branch: git(["branch", "--show-current"], cwd),
  };
}
