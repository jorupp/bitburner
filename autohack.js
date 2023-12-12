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
  
    const script = 'dohack.js';
    const servers = Array.from(scanned).filter(i => i !== 'home' && ns.hasRootAccess(i));
    for(const server of servers) {
      const r = ns.scriptKill(script, server);
      if (r) {
        ns.tprint(`Killed dohack.js on ${server}`);
      }
    }
    
    // TODO: look at RAM vs. money to focus more threads on high-value targets
    const scriptRam = ns.getScriptRam(script);
    for(const server of servers) {
      ns.scp(script, server);
      const serverRam = ns.getServerMaxRam(server);
      const threads = Math.floor(serverRam / scriptRam);
      if (threads > 0) {
        ns.exec(script, server, threads, server);
        ns.tprint(`Started ${threads} of ${script} on ${server}.`);
      } else {
        ns.tprint(`Unable to start ${script} on ${server} - ${serverRam} isn't enough for one thread of ${scriptRam}`);
      }
    }
  }