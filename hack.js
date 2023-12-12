/** @param {NS} ns **/
export async function main(ns) {
	var minMoney = 0;
	if (ns.args.length > 1) {
		minMoney = parseInt(ns.args[1]);
	}
	while (true) {
		if (ns.getServerMoneyAvailable(ns.args[0]) >= minMoney) {
			await ns.hack(ns.args[0]);
		} else {
			await ns.sleep(60000);
		}
	}
}