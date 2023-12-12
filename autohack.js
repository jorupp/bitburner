/** @param {NS} ns */
export async function main(ns) {
	function prettyPrint(value) {
		var suffixes = ['', 'k', 'm', 'b'];
		for(var ix=0; ix < suffixes.length && value > 1000; ix++ ) {
			value /= 1000;
		}
		if (value < 10) {
			return value.toFixed(2) + suffixes[ix];
		}
		if (value < 100) {
			return value.toFixed(1) + suffixes[ix];
		}
		return value.toFixed(0) + suffixes[ix];
	}

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

  const servers = Array.from(scanned).filter(i => i !== 'home' && ns.hasRootAccess(i));
  const script = 'dohack.js';
  const scriptRam = ns.getScriptRam(script);

  // figure out how many threads we can run on each, and what each server is worth (assuming that's just the max money)
  const threadCounts = [];
  const targets = [];
  for(const server of servers) {
    const serverRam = ns.getServerMaxRam(server);
    const threads = Math.floor(serverRam / scriptRam);
    if (threads > 0) {
      threadCounts.push({ server, threads });
    } else {
      ns.tprint(`Unable to start ${script} on ${server} - ${serverRam} isn't enough for one thread of ${scriptRam}`);
    }
    const value = ns.getServerMaxMoney(server);
    if (value > 0) {
      targets.push({ server, value });
    }
  }


  threadCounts.sort(({ threads: a }, { threads: b}) => b - a);
  targets.sort(({ value: a }, { value: b}) => b - a);

  for(const server of servers) {
    const r = ns.scriptKill(script, server);
    if (r) {
      ns.tprint(`Killed ${script} on ${server}`);
    }
  }

  // for simplicity's sake, just target the highest value target from the highest-thread server
  //   and any leftovers target the highest-value server
  for(let ix = 0; ix < threadCounts.length; ix++) {
    const { server, threads } = threadCounts[ix];
    const { server: target, value } = (targets[ix] || targets[0]);
    ns.scp(script, server);
    if (threads > 0) {
      const r = ns.exec(script, server, threads, target);
      if (r > 0) {
        ns.tprint(`Started ${threads} of ${script} on ${server} targeting ${target} with value ${prettyPrint(value)}.`);
      } else {
        ns.tprint(`[${r}] Unable to start ${threads} of ${script} on ${server} targeting ${target} with value ${prettyPrint(value)}.`);
      }
    } else {
      ns.tprint(`Unable to start ${script} on ${server} - ${threads} isn't greater than 0`);
    }
  }
}