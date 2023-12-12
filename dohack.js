/** @param {NS} ns */
export async function main(ns) {
  const numThreads = 13; // TODO: can we get this dynamically?
  const targetMoneyAmt = 0.9;

  const server = ns.args[0];
  const minSl = ns.getServerMinSecurityLevel(server);
  const maxMoney = ns.getServerMaxMoney(server);
  const targetSl = minSl * 0.05 * (numThreads + 1);
  const targetMoney = maxMoney * targetMoneyAmt;
	while(true) {
    let curSl = Math.floor(ns.getServerSecurityLevel(server) * 100)/100;
    if (curSl > targetSl) {
      ns.print("running weaken", { minSl, curSl, targetSl });
      await ns.weaken(server);
      continue;
    }
    let curMoney = ns.getServerMoneyAvailable(server);
    if (curMoney < targetMoney) {
      ns.print("running grow", { minSl, curSl, targetSl, curMoney, targetMoney, maxMoney });
      await ns.grow(server);
      continue;
    }
    ns.print("running hack", { minSl, curSl, targetSl, curMoney, targetMoney, maxMoney });
    await ns.hack(server);
	}
}