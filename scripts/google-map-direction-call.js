const googleClient = require('../lib/google-client');


const argv = require('yargs')
  .option('key', {
    alias: 'K',
    describe: 'api key for the call to google servers',
  })
  .demandOption(['key'], 'Please provide an api token')
  .help()
  .wrap(120)
  .argv;

function main() {

  googleClient.destination({
    apiKey: argv.key,
    origin: '1 Place Louis Braille, 69300 Caluire-et-Cuire, France', // '45.794096,4.851404',
    destination: '22 Rue Saint-Jean, 69005 Lyon, France', // '45.7633036,4.827853999999999',
  })
    .then((response) => {
      console.log('Google response:');
      console.log(JSON.stringify(response));
    })
    .then(() => {
      console.log('\nScript Finished');
      process.exit(0)
    })
    .catch((err) => {
      console.log('\nScript Finished with error');
      console.error(err.message);
      process.exit(1);
    });
}

main();