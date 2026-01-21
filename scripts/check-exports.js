try {
  const pkg = require('@opennextjs/cloudflare');
  console.log('Exports:', Object.keys(pkg));
} catch (e) {
  console.error(e);
}
