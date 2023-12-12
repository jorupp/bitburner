/** @param {NS} ns */
export async function main(ns) {
  function myMoney() {
      return Math.floor(ns.getServerMoneyAvailable("home"));
  }

  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("sleep");

  var countTarget = 25;
  var levelTarget = 70;
  var ramTarget = 4;
  var coreTarget = 1;

  while(true) {
    while(ns.hacknet.numNodes() < countTarget) {
      const res = ns.hacknet.purchaseNode();
      if (res == -1) {
        break;
      }
      ns.print(`Purchased hacknet Node with index ${res}`);
    };
    countTarget = ns.hacknet.numNodes();
    ns.print(`Currently have ${ns.hacknet.numNodes()} nodes`);

    for (var i = 0; i < countTarget; i++) {
      while (ns.hacknet.getNodeStats(i).level < levelTarget) {
        var cost = ns.hacknet.getLevelUpgradeCost(i, 1);
        while (myMoney() < cost) {
          ns.print(`Need $${cost}. Have $${myMoney()}, waiting to upgrade node ${i} from level ${ns.hacknet.getNodeStats(i).level} to ${levelTarget}.`);
          await ns.sleep(3000);
        }
        const res = ns.hacknet.upgradeLevel(i, 1);
        if (res == -1) {
          break;
        }
      };
    };

    ns.print("All nodes upgraded to level " + levelTarget);

    for (var i = 0; i < countTarget; i++) {
      while (ns.hacknet.getNodeStats(i).ram < ramTarget) {
        var cost = ns.hacknet.getRamUpgradeCost(i, 1);
        while (myMoney() < cost) {
          ns.print(`Need $${cost}. Have $${myMoney()}, waiting to upgrade node ${i} from RAM ${ns.hacknet.getNodeStats(i).ram} to ${ramTarget}.`);
          await ns.sleep(3000);
        }
        const res = ns.hacknet.upgradeRam(i, 1);
        if (res == -1) {
          break;
        }
      };
    };

    ns.print("All nodes upgraded to " + ramTarget + "GB RAM");

    for (var i = 0; i < countTarget; i++) {
      while (ns.hacknet.getNodeStats(i).cores < coreTarget) {
        var cost = ns.hacknet.getCoreUpgradeCost(i, 1);
        while (myMoney() < cost) {
          ns.print(`Need $${cost}. Have $${myMoney()}, waiting to upgrade node ${i} from Cores ${ns.hacknet.getNodeStats(i).cores} to ${coreTarget}.`);
          await ns.sleep(3000);
        }
        const res = ns.hacknet.upgradeCore(i, 1);
        if (res == -1) {
          break;
        }
      };
    };

    ns.print("All nodes upgraded to " + coreTarget + " cores");
      
    countTarget++;
    levelTarget += 10;
    ramTarget *= 2;
    coreTarget += 2;
  }
}