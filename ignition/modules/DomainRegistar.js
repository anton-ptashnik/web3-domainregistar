const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DomainRegistarModule", (m) => {
  const price = m.getParameter("registrationPrice", 1);
  const domainRegistar = m.contract("DomainRegistar", [price]);

  return { domainRegistar };
});
