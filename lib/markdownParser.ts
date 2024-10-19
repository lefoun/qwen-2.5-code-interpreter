export function extractCodeFromMarkdown(text: string): string | null {
  const codeBlockRegex = /```(?:python)?\n([\s\S]*?)\n```/;
  const match = text.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}

/// Extracts the required packages to run the python code.
export function extractPackagesFromCode(code: string): string[] {
  // A bit of a hairy regex to match both 'from package import module' and
  // 'import package'.
  const regex =
    /(?:import\s+([a-zA-Z_][\w]*)|from\s+([a-zA-Z_][\w]*)\s+import)/g;

  const packages = [];
  while (true) {
    const match = regex.exec(code);
    if (!match) {
      break;
    }
    // match[1] matches the the 'package' part of 'import package' and
    // match[2] matches the the 'package' part of 'from package import module'.
    packages.push(match[1] || match[2]);
  }

  return packages;
}
