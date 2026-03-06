require("ts-node").register({
  project: "tsconfig.hardhat.json",
  transpileOnly: true,
  compilerOptions: { module: "commonjs" },
});
require("./set-base-uri.cts");
