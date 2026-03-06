require("ts-node").register({
  project: "tsconfig.hardhat.json",
  transpileOnly: true,
  compilerOptions: { module: "commonjs" },
});
require("./deploy.cts");
