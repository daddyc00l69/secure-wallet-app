const origin1 = "https://secure-wallet-7o7k48mmt-tushars-projects-25d04397.vercel.app";
const origin2 = "https://secure-wallet-app-eight.vercel.app";
const envVar = `${origin1},${origin2}`;

const allowedOrigins = (envVar || '*').split(',');

const testOrigin = "https://secure-wallet-app-eight.vercel.app";

console.log(`Env Var: ${envVar}`);
console.log(`Allowed Origins: ${JSON.stringify(allowedOrigins)}`);
console.log(`Test Origin: ${testOrigin}`);

if (allowedOrigins.includes(testOrigin)) {
    console.log("MATCH: Allowed!");
} else {
    console.log("FAIL: Blocked!");
}
