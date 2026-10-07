export const CONVERT_SAMPLE = {
  name: "JSON Toolkit",
  version: "1.0.0",
  features: ["parse", "format", "convert", "compare"],
  config: { theme: "auto", indent: 2 },
  users: [
    { id: 1, name: "Alice", role: "admin", active: true },
    { id: 2, name: "Bob", role: "editor", active: true },
    { id: 3, name: "Charlie", role: "viewer", active: false },
  ],
  metadata: {
    created: "2024-01-15T10:30:00Z",
    updated: null,
    tags: ["utility", "dev-tool"],
  },
};

export const DIFF_SAMPLE_LEFT = {
  name: "My App",
  version: "1.0.0",
  config: { debug: true, port: 3000 },
  users: [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "editor" },
  ],
};

export const DIFF_SAMPLE_RIGHT = {
  name: "My App",
  version: "1.1.0",
  config: { debug: false, port: 3000, logLevel: "info" },
  users: [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob", role: "viewer" },
    { id: 3, name: "Charlie", role: "editor" },
  ],
};
