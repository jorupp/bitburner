/** @param {NS} ns **/
export async function main(ns) {
	var hackScript = 'hack.js';
	var weakenScript = 'weaken.script';
	var growScript = 'grow.script';
	var ratioHack = 1;
	var ratioWeaken = 2 * 7;
	var ratioGrow = 10 * 10;
	var minMoneyFactor = 0.8;
	var reserveHomeMemory = 8;
	var minValueFactor = 0.1; // don't bother targeting something with less than this much our max target

	var autoHack = ratioHack == 0;

	var maxRange = 10;
	var maxPorts = (ns.fileExists("BruteSSH.exe", "home") ? 1: 0) + 
		(ns.fileExists("FTPCrack.exe", "home") ? 1: 0) + 
		(ns.fileExists("relaySMTP.exe", "home") ? 1: 0) + 
		(ns.fileExists("HTTPWorm.exe", "home") ? 1: 0) + 
		(ns.fileExists("SQLInject.exe", "home") ? 1: 0) ;

	async function prepHost(host) {
		prepTarget(host);
		await ns.scp([ hackScript, weakenScript, growScript], host);
	}
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
	function prepTarget(target) {
		if (!ns.hasRootAccess(target)) {
			if (ns.fileExists("BruteSSH.exe", "home")) {
				ns.tprint(`Running brutessh on ${target}`);
				ns.brutessh(target);
			}
			if (ns.fileExists("FTPCrack.exe", "home")) {
				ns.tprint(`Running FTPCrack on ${target}`);
				ns.ftpcrack(target);
			}
			if (ns.fileExists("relaySMTP.exe", "home")) {
				ns.tprint(`Running relaySMTP on ${target}`);
				ns.relaysmtp(target);
			}
			if (ns.fileExists("HTTPWorm.exe", "home")) {
				ns.tprint(`Running HTTPWorm on ${target}`);
				ns.httpworm(target);
			}
			if (ns.fileExists("SQLInject.exe", "home")) {
				ns.tprint(`Running SQLInject on ${target}`);
				ns.sqlinject(target);
			}
			ns.tprint(`Nuking ${target}`);
			ns.nuke(target);
		}
	}
	function cmp(a,b) {
		if (a<b) { return -1; }
		if (a > b) { return 1;}
		return 0;
	}
	function getHostStats(killExisting) {
		var foundHosts = [];
		function doScan(path, prevHost, host, depth) {
			for(const p of ns.ps(host)) {
				if (killExisting && (p.filename == hackScript || p.filename == growScript || p.filename == weakenScript)) {
					ns.tprint(`Killing ${p.filename} on ${path} as part of startup`);
					ns.kill(p.pid);
				}
			}
			
			var freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			if (host == 'home') {
				freeRam -= reserveHomeMemory;
			}
			foundHosts.push({
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
				freeRam,
				processes: ns.ps(host),
			});
			for(var i of ns.scan(host)) {
				if (i == prevHost) {
					continue;
				}
				doScan(path + '/' + i, host, i, depth + 1);
			}
		}
		doScan('home', '', 'home', 0);
		// for(var ps of ns.getPurchasedServers()) {
		// 	doScan(ps, 'home', ps, 0);
		// }
		return foundHosts;
	}

	var hosts = getHostStats(true);

	// math is way easier if we treat them all as the same cost - they're close enough
	var threadCost = Math.max(
		ns.getScriptRam(hackScript),
		ns.getScriptRam(growScript),
		ns.getScriptRam(weakenScript),
	);
	ns.tprint(`Using script thread cost: ${threadCost}`);

	var level = ns.getHackingLevel();
	var options = hosts.filter(i => {
		var canUse = i.depth <= maxRange && i.hackLevel <= level && (i.portsReq <= maxPorts || i.hasRoot);
		if (!canUse) {
			ns.tprint(`Unable to use ${i.host} @ ${i.depth} needing lvl ${i.hackLevel} and ${i.portsReq} ports`);
		}
		return canUse;
	});

	var needLevel = hosts.filter(i => i.hackLevel > level && i.hackLevel <= level*2).sort((a,b) => cmp(b.maxMoney, a.maxMoney)).slice(0, 10);
	ns.tprint('Future hack options by money:');
	for(const nl of needLevel) {
		ns.tprint(`  ${nl.host} - ${'$'}${prettyPrint(nl.maxMoney)}, R: ${prettyPrint(nl.ram)} @ ${nl.hackLevel}`);
	}

	var byRam = options.map(i => i).sort((a, b) => cmp(b.freeRam, a.freeRam));
	var byMaxMoney = options.filter(i => i.host != 'home' && i.maxMoney > 0).map(i => i).sort((a, b) => cmp(b.maxMoney,a.maxMoney));
	var maxServerThreads = options.map(i => ({ host: i.host, freeRam: i.freeRam, count: Math.floor(i.freeRam / threadCost) })).sort((a,b) => cmp(b.count, a.count));
	var maxThreads = maxServerThreads.reduce((p, c) => p + c.count, 0);

	var bestMaxMoney = byMaxMoney[0].maxMoney;
	var viableTargets = byMaxMoney.filter(i => i.maxMoney > bestMaxMoney * minValueFactor).length;
	 // 0.8 is a guess - need better system to weight mix
	var mult = Math.ceil(0.8 * maxThreads / viableTargets / (ratioHack + ratioWeaken + ratioGrow));
	ns.tprint(`Best target has ${prettyPrint(bestMaxMoney)}, at ${(minValueFactor*100).toFixed(0)}%, there are ${viableTargets} viable targets - using ${mult} multipler`);

	var numHack = ratioHack * mult;
	var numWeaken = ratioWeaken * mult;
	var numGrow = ratioGrow * mult;

	var numTargets = Math.min(byMaxMoney.length, Math.ceil(maxThreads / (numHack + numWeaken + numGrow)));

	for(const hostInfo of maxServerThreads) {
		if (hostInfo.count > 0) {
			await prepHost(hostInfo.host);
		}
	}

	ns.tprint(`Expect to be able to run ${maxThreads} threads of ${threadCost} - will target ${numTargets} servers`);

	var targets = [];

	for(var tgtIx=0; tgtIx < numTargets; tgtIx++ ) {
		var targetInfo = byMaxMoney[tgtIx];
		var target = targetInfo.host;
		var minMoney = targetInfo.maxMoney * minMoneyFactor;
		prepTarget(target);
		targets.push(target);

		var thisMult = Math.ceil(mult * Math.max(1,Math.log(targetInfo.maxMoney/(bestMaxMoney*minValueFactor))));
		var remainingHack = ratioHack * thisMult;
		var remainingWeaken = ratioWeaken * thisMult;
		var remainingGrow = ratioGrow * thisMult;
		ns.tprint(`Using target multiplier of ${thisMult} (base was ${mult}) for ${target}`);

		for(var hostInfo of maxServerThreads) {
			async function launch(script, remaining) {
				if (hostInfo.count > 0) {
					if (remaining > 0) {
						var toLaunch = Math.min(hostInfo.count, remaining);
						// ns.tprint(`MIN ${hostInfo.count}, ${remaining} -> ${toLaunch}`);
						hostInfo.count -= toLaunch;
						// ns.tprint(`UPDATED ${hostInfo.count}`);
						var ret = await ns.exec(script, hostInfo.host, toLaunch, target, minMoney);
						if (ret == 0) {
							ns.tprint(`  FAILED Launch of ${script} from ${hostInfo.host} (ram: ${hostInfo.freeRam}, tLeft: ${hostInfo.count}) with ${toLaunch} threads against ${target} (${prettyPrint(targetInfo.maxMoney)})`);
						} else {
							ns.tprint(`  Launched ${script} (pid: ${ret}) from ${hostInfo.host} (ram: ${hostInfo.freeRam}, tLeft: ${hostInfo.count}) with ${toLaunch} threads against ${target} (${prettyPrint(targetInfo.maxMoney)})`);
						}
						await ns.sleep(10);
						return toLaunch;
					}
				}
				return 0;
			}

			remainingHack -= await launch(hackScript, remainingHack);
			remainingWeaken -= await launch(weakenScript, remainingWeaken);
			remainingGrow -= await launch(growScript, remainingGrow);
		}
	}

	function dumpTargetStats() {
		for(var target of targets) {
			var money = ns.getServerMoneyAvailable(target);
			var maxMoney = ns.getServerMaxMoney(target);
			var sec = ns.getServerSecurityLevel(target);
			var minSec = ns.getServerMinSecurityLevel(target);
			ns.print(`${target}: ${prettyPrint(money)}/${prettyPrint(maxMoney)} (${(100*money/maxMoney).toFixed(0)}%) -- ${sec.toFixed(2)}/${minSec.toFixed(2)} (+${(sec-minSec).toFixed(2)})`);
		}
	}
	
	async function hackOverLimit() {
		for(var target of targets) {
			var money = ns.getServerMoneyAvailable(target);
			var maxMoney = ns.getServerMaxMoney(target);
			var sec = ns.getServerSecurityLevel(target);
			var minSec = ns.getServerMinSecurityLevel(target);
			while (maxMoney * minMoneyFactor <= money) {
				dumpTargetStats();
				ns.tprint(`Hacking ${target} - ${prettyPrint(money)}/${prettyPrint(maxMoney)}  (${(100*money/maxMoney).toFixed(0)}%) -- ${sec.toFixed(2)}/${minSec.toFixed(2)} (+${(sec-minSec).toFixed(2)}) ...`);
				await ns.hack(target);
				money = ns.getServerMoneyAvailable(target);
				maxMoney = ns.getServerMaxMoney(target);
				sec = ns.getServerSecurityLevel(target);
				minSec = ns.getServerMinSecurityLevel(target);
				ns.tprint(`Hack of ${target} complete - ${prettyPrint(money)}/${prettyPrint(maxMoney)}  (${(100*money/maxMoney).toFixed(0)}%) -- ${sec.toFixed(2)}/${minSec.toFixed(2)} (+${(sec-minSec).toFixed(2)}) ...`);
			}
		}
	}

	ns.disableLog('getServerMoneyAvailable');
	ns.disableLog('getServerMaxMoney');
	ns.disableLog('getServerSecurityLevel');
	ns.disableLog('getServerMinSecurityLevel');
	ns.disableLog('sleep');
	while(true) {
		ns.print("============");
		if (autoHack) {
			await hackOverLimit();
		}
		dumpTargetStats();
		await ns.sleep(60000);
	}
}