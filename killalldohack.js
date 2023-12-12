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
    for(const server of servers) {
      const r = ns.scriptKill('dohack.js', server);
      if (r) {
        ns.tprint(`Killed dohack.js on ${server}`);
      }
    }
  }