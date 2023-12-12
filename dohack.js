/** @param {NS} ns */
export async function main(ns) {
    let server = ns.args[0];
    let minSl = ns.getServerMinSecurityLevel(server);
    let maxMoney = ns.getServerMaxMoney(server);
    let targetSl = minSl * 1.1 + 0.1;
    let targetMoney = maxMoney * 0.8;
      while(true) {
      let curSl = ns.getServerSecurityLevel(server);
      if (curSl > targetSl) {
        ns.print("running weaken", { curSl, targetSl });
        await ns.weaken(server);
        continue;
      }
      let curMoney = ns.getServerMoneyAvailable(server);
      if (curMoney < targetMoney) {
        ns.print("running grow", { curSl, targetSl, curMoney, targetMoney });
        await ns.grow(server);
        continue;
      }
      ns.print("running hack", { curSl, targetSl, curMoney, targetMoney });
      await ns.hack(server);
      }
  }