/** @param {NS} ns */
export async function main(ns) {
    const scanned = new Set();
    const toScan = new Set(ns.scan());
    while(toScan.size > 0) {
      const target = toScan.values().next().value;
      toScan.delete(target);
      scanned.add(target);
      const targets = ns.scan(target);
      for(const t of targets) {
        if (scanned.has(t)) continue;
        if (toScan.has(t)) continue;
        toScan.add(t);
      }
    }
  
    const servers = Array.from(scanned).filter(i => i !== 'home');
    const toHack = servers.filter(i => !ns.hasRootAccess(i));
    ns.tprint(`Found ${servers.length} servers, ${toHack.length} of which we don't have root access to yet`);
    const hacked = [];
  
    const hasSsh = ns.fileExists('BruteSSH.exe');
    const hasFtp = ns.fileExists('FTPCrack.exe');
    const hasSmtp = ns.fileExists('relaySMTP.exe');
    const hasHttp = ns.fileExists('HTTPWorm.exe');
    const hasSql = ns.fileExists('SQLInject.exe');
    const maxPorts = 0
      + (hasSsh ? 1 : 0)
      + (hasFtp ? 1 : 0)
      + (hasSmtp ? 1 : 0)
      + (hasHttp ? 1 : 0)
      + (hasSql ? 1 : 0);
    
    let needLevel = 0;
    let nextLevel = 10000;
    let needPorts = 0;
    let nextPorts = 10000;
    for(const target of toHack) {
      if (ns.getServerRequiredHackingLevel(target) > ns.getHackingLevel()) {
        needLevel++;
        nextLevel = Math.min(nextLevel, ns.getServerRequiredHackingLevel(target));
        continue;
      }
      const portsNeeded = ns.getServerNumPortsRequired(target);
      if (portsNeeded <= maxPorts) {
        if (portsNeeded >= 1 && hasSsh) {
          ns.brutessh(target);
        }
        if (portsNeeded >= 2 && hasFtp) {
          ns.ftpcrack(target);
        }
        if (portsNeeded >= 3 && hasSmtp) {
          ns.relaysmtp(target);
        }
        if (portsNeeded >= 4 && hasHttp) {
          ns.httpworm(target);
        }
        if (portsNeeded >= 5 && hasSql) {
          ns.sqlinject(target);
        }
        ns.nuke(target);
        if(ns.hasRootAccess(target)) {
          hacked.push(target);
        } else {
          ns.tprint(`Expected to be able to nuke ${target}, but it failed`);
        }
      } else {
        needPorts++;
        nextPorts = Math.min(nextPorts, portsNeeded);
      }
    }
  
    if(needLevel > 0) {
      ns.tprint(`Unable to hack ${needLevel} server(s) due to level requirement, next unlocks at ${nextLevel}.`);
    }
    if(needPorts > 0) {
      ns.tprint(`Unable to hack ${needPorts} server(s) due to port requirement, next unlocks at ${nextPorts}.`);
    }
    ns.tprint(`Hacked ${hacked.length} additional server(s):`, hacked);
  
    const allHacked = servers.filter(i => ns.hasRootAccess(i));
    for(const t of allHacked) {
      ns.tprint(`${t}: ${ns.getServerUsedRam(t)}/${ns.getServerMaxRam(t)}`);
    }
  }