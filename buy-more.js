/** @param {NS} ns **/
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
	
	var servers = ns.getPurchasedServers();
	var maxServers = ns.getPurchasedServerLimit();
	var maxRam = ns.getPurchasedServerMaxRam();
	ns.tprint(`Currently own ${servers.length} server(s) of ${maxServers}, which can have at most ${maxRam}GB`);
	var myMoney = ns.getServerMoneyAvailable('home');
	for(var server of servers) {
		ns.tprint(`  ${server}: ${ns.getServerMaxRam(server)}`);
	}
	for(var ram=maxRam; ram >=1; ram/=2) {
		var cost = ns.getPurchasedServerCost(ram);
		ns.tprint(`Price for server with ${ram}GB: ${prettyPrint(cost)} (${(myMoney >= cost ? 'YES' : 'NO')})`);
	}

	if(ns.args.length > 0) {
		var targetRam = parseInt(ns.args[0]);
		while(ns.getServerMoneyAvailable('home') > ns.getPurchasedServerCost(targetRam) && ns.getPurchasedServerLimit() > ns.getPurchasedServers().length)  {
			ns.tprint(`Purchasing next ${targetRam}GB server for ${ns.getPurchasedServerCost(targetRam)}, we have ${ns.getServerMoneyAvailable('home')}`);
			ns.purchaseServer('bought', targetRam);
		}

		ns.tprint(`Next ${targetRam}GB server would cost ${ns.getPurchasedServerCost(targetRam)}, we have ${ns.getServerMoneyAvailable('home')}`);
	}
}