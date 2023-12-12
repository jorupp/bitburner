export async function main(ns) {
	var hosts = [];
	function cmp(a,b) {
		if (a<b) { return -1; }
		if (a > b) { return 1;}
		return 0;
	}
	function doScan(path, prevHost, host, depth) {
		if (host != 'home') {
			hosts.push({
				path,
				depth,
				host,
				hasRoot: ns.hasRootAccess(host),
				money: ns.getServerMoneyAvailable(host),
				maxMoney: ns.getServerMaxMoney(host),
				sec: ns.getServerSecurityLevel(host),
				minSec: ns.getServerMinSecurityLevel(host),
				hackLevel: ns.getServerRequiredHackingLevel(host),
				portsReq: ns.getServerNumPortsRequired(host),
				ram: ns.getServerMaxRam(host),
			});
		}
		for(var i of ns.scan(host)) {
			if (i == prevHost) {
				continue;
			}
			doScan(path + '/' + i, host, i, depth + 1);
		}
	}
	doScan('home', '', 'home', 0);

	var level = ns.getHackingLevel();
	var options = hosts.filter(i => i.depth <= 3 && i.hackLevel <= level && (i.portsReq <= 2 || i.hasRoot));
	ns.tprint(JSON.stringify(options, null, 2));

	var byRam = options.map(i => ({ path: i.path, ram: i.ram })).sort((a, b) => cmp(a.ram,b.ram));
	var byMaxMoney = options.map(i => ({ path: i.path, maxMoney: i.maxMoney })).sort((a, b) => cmp(a.maxMoney,b.maxMoney));

	ns.tprint("By max money:");
	for(var i of byMaxMoney) {
		ns.tprint(`${i.path}: ${i.maxMoney}`);
	}

	ns.tprint("By ram:");
	for(var i of byRam) {
		ns.tprint(`${i.path}: ${i.ram}`);
	}
}