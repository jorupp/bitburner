/** @param {NS} ns */
export async function main(ns) {
  let [script, server, threadsStr, ...rest] = ns.args;
  // ns.tprint({ script, server, threadsStr, rest });
  ns.scp(script, server);
  let serverRam = ns.getServerMaxRam(server);
  let scriptRam = ns.getScriptRam(script, server);
  let maxThreads = Math.floor(serverRam / scriptRam);
  let threads = parseInt(threadsStr);
  // ns.tprint({ serverRam, scriptRam, maxThreads, threads });
  if (threads > maxThreads) {
    ns.tprint(`Unable to launch w/ ${threads} threads - ${serverRam}/${scriptRam} only allows ${maxThreads} threads`);
    return;
  }
  let res = ns.exec(script, server, threads, ...rest);
  if (res > 0) {
    ns.tprint(`Launched script successfully: ${res}`);
  } else {
    ns.tprint(`Failed to launch script: ${res} - maybe out of RAM?`);
  }
}