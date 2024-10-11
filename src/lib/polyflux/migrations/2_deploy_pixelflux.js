const Polyflux1 = artifacts.require("Polyflux1");
const Polyflux2 = artifacts.require("Polyflux2");
const Polyflux3 = artifacts.require("Polyflux3");
const TIMEOUT = 120

Polyflux1.synchronization_timeout = TIMEOUT;
Polyflux1.synchronization_timeout = TIMEOUT;
Polyflux1.synchronization_timeout = TIMEOUT;

module.exports = async function(deployer) {
  await deployer.deploy(Polyflux1);
  const polyFlux1Instance = await Polyflux1.deployed();

  await deployer.deploy(Polyflux2, polyFlux1Instance.address);
  const polyFlux2Instance = await Polyflux2.deployed();

  await deployer.deploy(Polyflux3, polyFlux1Instance.address, polyFlux2Instance.address);
};
